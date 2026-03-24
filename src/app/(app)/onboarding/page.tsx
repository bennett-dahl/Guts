import { completeOnboarding } from "@/app/actions";

const PDF_BASE = "https://theplantfedgut.com/wp-content/uploads/2021/05";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Your gut-friendly template</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This app is <strong>wellness software</strong>, not medical advice. If
        you have IBS, IBD, SIBO, an eating disorder, or are on a clinical diet,
        work with your clinician or dietitian before changing how you eat.
      </p>
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="font-semibold text-emerald-800 dark:text-emerald-300">
          Fiber-forward (Dr. Will Bulsiewicz — public themes)
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>Diverse plants</strong> — many people aim for ~30 different
            plant types per week (including herbs and spices).
          </li>
          <li>
            <strong>Fiber</strong> from whole grains, legumes, vegetables, fruit,
            nuts, and seeds.
          </li>
          <li>
            <strong>Fermented foods</strong> regularly, alongside fiber.
          </li>
          <li>
            <strong>Polyphenol-rich</strong> foods (berries, EVOO, tea/coffee,
            colorful plants).
          </li>
          <li>
            Optional <strong>FODMAP awareness</strong> if you are sensitive —
            use official guides rather than random restriction.
          </li>
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Not affiliated with Dr. Bulsiewicz. Summaries from public interviews and
          his book companion resources.
        </p>
      </section>
      <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold">Official PDFs (external)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <a
              className="text-emerald-700 underline dark:text-emerald-400"
              href={`${PDF_BASE}/FODMAPs-Bulsiewicz-1.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              FODMAP guide (PDF)
            </a>
          </li>
          <li>
            <a
              className="text-emerald-700 underline dark:text-emerald-400"
              href={`${PDF_BASE}/Fiber-Fueled-Shopping-Lists-Bulsiewicz.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Fiber Fueled shopping lists (PDF)
            </a>
          </li>
          <li>
            <a
              className="text-emerald-700 underline dark:text-emerald-400"
              href={`${PDF_BASE}/Dr.-Bulsiewicz-Probiotic-Guide-.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Probiotic guide (PDF)
            </a>
          </li>
          <li>
            <a
              className="text-emerald-700 underline dark:text-emerald-400"
              href="https://theplantfedgut.com/fiber-fueled-book-resources/"
              target="_blank"
              rel="noopener noreferrer"
            >
              All book resources — theplantfedgut.com
            </a>
          </li>
        </ul>
      </section>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Your profile starts with a <strong>Fiber Fueled–style</strong> default
        (plant diversity goal, fiber target). You can tune it later under More →
        settings when we add the editor.
      </p>
      <div className="flex flex-col gap-3">
        <form action={completeOnboarding}>
          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            I understand — continue to the app
          </button>
        </form>
        <form action={completeOnboarding} className="text-center">
          <button
            type="submit"
            className="text-sm text-zinc-500 underline"
            name="intent"
            value="skip"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
