const FEATURES = [
  "Employee Management: View detailed profiles, track performance, and manage attendance.",
  "Performance Insights: Analyze team goals, progress, and achievements.",
  "Attendance & Leaves: Track attendance patterns and manage leave requests effortlessly.",
]

export function HeroPanel() {
  return (
    <section className="relative min-h-[22rem] w-full overflow-hidden rounded-3xl lg:h-full">
      <img
        src="/loginheroimage.jpg"
        alt="A team of colleagues collaborating around a laptop in a bright office"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-3xl"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 30%, transparent 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative flex h-full flex-col justify-end p-[clamp(1.5rem,3vw,3rem)]">
        <h1 className="text-hero font-medium text-white">
          Welcome to WORKHIVE!
        </h1>
        <ul className="mt-5 space-y-2.5">
          {FEATURES.map((feature) => {
            const [title, rest] = feature.split(":")
            return (
              <li
                key={title}
                className="flex gap-2 text-body text-white/90"
              >
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-white/90" />
                <span>
                  <span className="font-medium">{title}:</span>
                  {rest}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
