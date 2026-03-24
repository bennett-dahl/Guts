import { createHash } from "crypto";

export type InstacartLineItem = {
  name: string;
  display_text?: string;
  line_item_measurements?: { quantity: number; unit: string }[];
  upcs?: string[];
  filters?: {
    brand_filters?: string[];
    health_filters?: string[];
  };
};

export function cacheKeyForLineItems(
  title: string,
  items: InstacartLineItem[],
  linkType: "shopping_list" | "recipe",
) {
  const h = createHash("sha256");
  h.update(linkType);
  h.update("\n");
  h.update(title);
  h.update("\n");
  h.update(JSON.stringify(items));
  return h.digest("hex");
}

export async function createInstacartProductsLink(opts: {
  title: string;
  lineItems: InstacartLineItem[];
  linkType: "shopping_list" | "recipe";
  instructions?: string[];
  imageUrl?: string;
  partnerLinkbackUrl?: string;
  enablePantryItems?: boolean;
  servings?: number;
  cookingTimeMin?: number;
  recipeAuthor?: string;
  externalReferenceId?: string;
}) {
  const base =
    process.env.INSTACART_API_BASE ||
    "https://connect.dev.instacart.tools";
  const key = process.env.INSTACART_API_KEY;
  if (!key) {
    throw new Error("INSTACART_API_KEY is not configured.");
  }

  const path =
    opts.linkType === "recipe"
      ? "/idp/v1/products/recipe"
      : "/idp/v1/products/products_link";

  const toShoppingListItem = (item: InstacartLineItem) => ({
    name: item.name,
    display_text: item.display_text,
    line_item_measurements: item.line_item_measurements,
    upcs: item.upcs,
    filters: item.filters,
  });

  const toRecipeIngredient = (item: InstacartLineItem) => ({
    name: item.name,
    display_text: item.display_text,
    measurements: item.line_item_measurements,
    upcs: item.upcs,
    filters: item.filters,
  });

  const body: Record<string, unknown> = {
    title: opts.title,
    ...(opts.linkType === "shopping_list"
      ? {
          link_type: "shopping_list",
          line_items: opts.lineItems.map(toShoppingListItem),
        }
      : {
          ingredients: opts.lineItems.map(toRecipeIngredient),
        }),
  };

  if (opts.linkType === "recipe") {
    if (opts.servings != null) body.servings = opts.servings;
    if (opts.cookingTimeMin != null) body.cooking_time = opts.cookingTimeMin;
    if (opts.recipeAuthor) body.author = opts.recipeAuthor;
    if (opts.externalReferenceId) body.external_reference_id = opts.externalReferenceId;
  }

  if (opts.instructions?.length) body.instructions = opts.instructions;
  if (opts.imageUrl) body.image_url = opts.imageUrl;

  const landing: Record<string, unknown> = {};
  if (opts.partnerLinkbackUrl) {
    landing.partner_linkback_url = opts.partnerLinkbackUrl;
  }
  if (opts.enablePantryItems && opts.linkType === "recipe") {
    landing.enable_pantry_items = true;
  }
  if (Object.keys(landing).length) {
    body.landing_page_configuration = landing;
  }

  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instacart API ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as { products_link_url?: string };
  if (!data.products_link_url) {
    throw new Error("Instacart response missing products_link_url");
  }
  return data.products_link_url;
}
