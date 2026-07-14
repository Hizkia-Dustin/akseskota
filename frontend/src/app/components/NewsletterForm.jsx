"use client";

import { useState } from "react";

export default function NewsletterForm({ compact = false }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputId = compact ? "newsletter-email-mobile" : "newsletter-email-desktop";

  function handleSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <form className={compact ? "relative z-10 mt-5" : "relative z-10 flex flex-col items-start gap-[15.466px]"} onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={inputId}>Alamat email</label>
      <input
        id={inputId}
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => { setEmail(event.target.value); setSubmitted(false); }}
        placeholder="Enter your email"
        className={compact
          ? "h-14 w-full rounded-full bg-white px-6 text-[12px] text-[#101828] outline-none ring-[#7be3dc] transition focus:ring-4"
          : "h-[65.921px] w-[346.024px] rounded-[104.397px] border border-[#d9dbe9] bg-white px-[22.17px] text-[14.61px] font-medium text-[#101828] shadow-[0px_1.933px_11.6px_rgba(20,20,43,0.08)] outline-none ring-[#7be3dc] transition focus:ring-4"
        }
      />
      <button
        type="submit"
        className={compact
          ? "mt-3 cursor-pointer rounded-full bg-[#41c5bd] px-6 py-3 text-[12px] font-bold transition hover:bg-[#52d4cc] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          : "cursor-pointer rounded-[73.464px] bg-[#3bb8b0] px-[23.199px] py-[17.399px] text-[14.61px] font-medium text-white transition hover:bg-[#52cbc3] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        }
      >
        {submitted ? "Subscribed ✓" : "Subscribe"}
      </button>
    </form>
  );
}
