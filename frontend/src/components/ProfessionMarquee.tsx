interface Profession {
  label: string;
}

const professions: Profession[] = [
  { label: "Trener personalny" },
  { label: "Wizażysta" },
  { label: "Fryzjer" },
  { label: "Instruktor pierwszej pomocy" },
  { label: "Specjalista SEO" },
  { label: "Instruktor jogi" },
  { label: "Barista" },
  { label: "Groomer" },
  { label: "Grafik komputerowy" },
  { label: "Web developer" },
  { label: "Kucharz" },
  { label: "Lektor języka" },
  { label: "Fotograf" },
  { label: "Instruktor muzyki" },
  { label: "Niania" },
  { label: "Behawiorysta zwierząt" },
  { label: "Specjalista IT" },
  { label: "Konsultant ekologiczny" },
  { label: "Florysta" },
];

export function ProfessionMarquee() {
  return (
    <div className="relative overflow-hidden py-1 mask-fade-x">
      <div className="animate-marquee-slow flex w-max items-center">
        {[...professions, ...professions].map((profession, index) => (
          <div
            key={`${profession.label}-${index}`}
            className="flex items-center gap-2.5 whitespace-nowrap px-6 text-sm font-medium text-ink-soft"
          >
            {profession.label}
            <span className="ml-6 h-1 w-1 rounded-full bg-ink/15" />
          </div>
        ))}
      </div>
    </div>
  );
}
