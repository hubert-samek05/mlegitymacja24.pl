"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Dla jakich branż i zawodów przeznaczona jest platforma?",
    answer:
      "mLegitymacja24 jest uniwersalną platformą dla dowolnej firmy szkoleniowej — niezależnie od branży. Korzystają z niej szkoły kosmetologii, akademie trenerów personalnych, instytuty terapii, kursy pierwszej pomocy, szkoły językowe i wiele innych organizacji wystawiających uprawnienia zawodowe.",
  },
  {
    question: "Czy mogę zdefiniować własny, unikalny typ legitymacji?",
    answer:
      "Tak. Typy legitymacji są konfigurowalne — możesz zdefiniować nazwę, opis, domyślny okres ważności oraz dodatkowe pola dopasowane do specyfiki Twojej branży.",
  },
  {
    question: "Jak długo trwa wystawienie legitymacji absolwentowi?",
    answer:
      "Wystawienie legitymacji zajmuje mniej niż minutę — wystarczy uzupełnić dane absolwenta, wybrać typ legitymacji i zapisać. Absolwent automatycznie otrzymuje dostęp do swojego cyfrowego portfela.",
  },
  {
    question: "Czy legitymację można podrobić lub skopiować?",
    answer:
      "Każda legitymacja prezentowana jest jako dynamiczny, podpisany kryptograficznie kod QR, który wygasa po kilkudziesięciu sekundach. Zrzut ekranu lub zdjęcie kodu przestaje działać niemal natychmiast, co skutecznie chroni przed nieuprawnionym kopiowaniem.",
  },
  {
    question: "Co się dzieje, gdy firma unieważni legitymację?",
    answer:
      "Zmiana statusu jest natychmiastowa i widoczna globalnie — każda kolejna weryfikacja tej legitymacji, niezależnie gdzie i kiedy, natychmiast pokaże status „unieważniona” wraz z podanym powodem.",
  },
  {
    question: "Czy osoba weryfikująca musi mieć konto lub aplikację?",
    answer:
      "Nie. Weryfikacja odbywa się w przeglądarce, bez logowania i bez instalowania jakiejkolwiek aplikacji — wystarczy zeskanować kod QR telefonem.",
  },
  {
    question: "Czy legitymacje trzeba rejestrować w Zintegrowanym Systemie Kwalifikacji?",
    answer:
      "Nie. Wpis do ZRK jest całkowicie dobrowolny. Legitymacje wydawane na platformie to dokumenty zawodowe i branżowe wystawiane przez prywatne firmy szkoleniowe — nie wymagają żadnej rejestracji państwowej. Jeśli jednak Twoja organizacja jest instytucją certyfikującą w ZSK, platforma wspiera również wydawanie certyfikatów kwalifikacji wolnorynkowych i sektorowych wraz z wymaganą ewidencją.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="group flex w-full items-center justify-between gap-6 py-6 text-left"
            >
              <span className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-brand-700 sm:text-xl">
                {item.question}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isOpen
                    ? "border-brand-600 bg-brand-gradient text-white"
                    : "border-ink/15 text-ink-soft group-hover:border-brand-400 group-hover:text-brand-600"
                }`}
              >
                <Plus className="h-4 w-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-ink-soft">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
