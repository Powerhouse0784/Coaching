// ── Fee Plans ──────────────────────────────────────────────────────────────────
export const FEE_PLANS = [

  // ── Class 5 ──────────────────────────────────────────────────────────────
  { id: "cls5-math", class: "Class 5", subject: "Mathematics", price: 250,  originalPrice: 499,  duration: "1 Month", popular: false },
  { id: "cls5-eng",  class: "Class 5", subject: "English",     price: 250,  originalPrice: 499,  duration: "1 Month", popular: false },
  { id: "cls5-sci",  class: "Class 5", subject: "Science",     price: 250,  originalPrice: 499,  duration: "1 Month", popular: false },
  { id: "cls5-sst",  class: "Class 5", subject: "Social Sc.",  price: 250,  originalPrice: 499,  duration: "1 Month", popular: false },
  { id: "cls5-all",  class: "Class 5", subject: "All Subjects",price: 800, originalPrice: 1999, duration: "1 Month", popular: true  },

  // ── Class 6 ──────────────────────────────────────────────────────────────
  { id: "cls6-math", class: "Class 6", subject: "Mathematics", price: 350,  originalPrice: 599,  duration: "1 Month", popular: false },
  { id: "cls6-eng",  class: "Class 6", subject: "English",     price: 350,  originalPrice: 599,  duration: "1 Month", popular: false },
  { id: "cls6-sci",  class: "Class 6", subject: "Science",     price: 350,  originalPrice: 599,  duration: "1 Month", popular: false },
  { id: "cls6-sst",  class: "Class 6", subject: "Social Sc.",  price: 350,  originalPrice: 599,  duration: "1 Month", popular: false },
  { id: "cls6-all",  class: "Class 6", subject: "All Subjects",price: 1200, originalPrice: 2399, duration: "1 Month", popular: true  },

  // ── Class 7 ──────────────────────────────────────────────────────────────
  { id: "cls7-math", class: "Class 7", subject: "Mathematics", price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls7-eng",  class: "Class 7", subject: "English",     price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls7-sci",  class: "Class 7", subject: "Science",     price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls7-sst",  class: "Class 7", subject: "Social Sc.",  price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls7-all",  class: "Class 7", subject: "All Subjects",price: 1400, originalPrice: 2649, duration: "1 Month", popular: true  },

  // ── Class 8 ──────────────────────────────────────────────────────────────
  { id: "cls8-math", class: "Class 8", subject: "Mathematics", price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls8-eng",  class: "Class 8", subject: "English",     price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls8-sci",  class: "Class 8", subject: "Science",     price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls8-sst",  class: "Class 8", subject: "Social Sc.",  price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls8-all",  class: "Class 8", subject: "All Subjects",price: 1400, originalPrice: 2649, duration: "1 Month", popular: true  },

  // ── Class 9 ──────────────────────────────────────────────────────────────
  { id: "cls9-math", class: "Class 9", subject: "Mathematics", price: 550,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls9-eng",  class: "Class 9", subject: "English",     price: 550,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls9-sci",  class: "Class 9", subject: "Science",     price: 550,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls9-sst",  class: "Class 9", subject: "Social Sc.",  price: 550,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls9-all",  class: "Class 9", subject: "All Subjects",price: 2000, originalPrice: 3099, duration: "1 Month", popular: true  },

  // ── Class 10 ─────────────────────────────────────────────────────────────
  { id: "cls10-math", class: "Class 10", subject: "Mathematics", price: 600,  originalPrice: 899, duration: "1 Month", popular: false },
  { id: "cls10-sci",  class: "Class 10", subject: "Science",     price: 600,  originalPrice: 899, duration: "1 Month", popular: false },
  { id: "cls10-eng",  class: "Class 10", subject: "English",     price: 600,  originalPrice: 899,  duration: "1 Month", popular: false },
  { id: "cls10-sst",  class: "Class 10", subject: "Social Sc.",  price: 600,  originalPrice: 899,  duration: "1 Month", popular: false },
  
  { id: "cls10-all",  class: "Class 10", subject: "All Subjects",price: 2200, originalPrice: 3599, duration: "1 Month", popular: true  },

  // ── Class 11 — Science ────────────────────────────────────────────────────
  { id: "cls11-sci-phy",  class: "Class 11 (Science)", subject: "Physics",     price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-chem", class: "Class 11 (Science)", subject: "Chemistry",   price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-math", class: "Class 11 (Science)", subject: "Mathematics", price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-bio",  class: "Class 11 (Science)", subject: "Biology",     price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-eng",  class: "Class 11 (Science)", subject: "English",     price: 700,  originalPrice: 1099, duration: "1 Month", popular: false },
  { id: "cls11-sci-cs",   class: "Class 11 (Science)", subject: "Computer Sc.",price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-pcm",  class: "Class 11 (Science)", subject: "PCM Bundle",  price: 2200, originalPrice: 3797, duration: "1 Month", popular: true  },
  { id: "cls11-sci-pcb",  class: "Class 11 (Science)", subject: "PCB Bundle",  price: 2200, originalPrice: 3797, duration: "1 Month", popular: true  },

  // ── Class 11 — Commerce ───────────────────────────────────────────────────
  { id: "cls11-com-acc",  class: "Class 11 (Commerce)", subject: "Accountancy",       price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-eco",  class: "Class 11 (Commerce)", subject: "Economics",         price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-bst",  class: "Class 11 (Commerce)", subject: "Business Studies",  price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-math", class: "Class 11 (Commerce)", subject: "Mathematics",       price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-eng",  class: "Class 11 (Commerce)", subject: "English",           price: 700,  originalPrice: 1099, duration: "1 Month", popular: false },
  { id: "cls11-com-ip",   class: "Class 11 (Commerce)", subject: "Informatics Pr.",   price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-core", class: "Class 11 (Commerce)", subject: "Core 3 (Acc+Eco+BSt)",price: 2200, originalPrice: 3897, duration: "1 Month", popular: true  },

  // ── Class 11 — Arts / Humanities ─────────────────────────────────────────
  { id: "cls11-arts-hist",  class: "Class 11 (Arts)", subject: "History",          price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-geo",   class: "Class 11 (Arts)", subject: "Geography",        price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-pol",   class: "Class 11 (Arts)", subject: "Political Science",price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-eco",   class: "Class 11 (Arts)", subject: "Economics",        price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-soci",  class: "Class 11 (Arts)", subject: "Sociology",        price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-psych", class: "Class 11 (Arts)", subject: "Psychology",       price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-eng",   class: "Class 11 (Arts)", subject: "English",          price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-core",  class: "Class 11 (Arts)", subject: "Core 3 Subjects",  price: 1800, originalPrice: 3497, duration: "1 Month", popular: true  },
  { id: "cls11-arts-all",   class: "Class 11 (Arts)", subject: "Combined 5 Subjects",     price: 3100, originalPrice: 3500, duration: "1 Month", popular: false },

  // ── Class 12 — Science ────────────────────────────────────────────────────
  { id: "cls12-sci-phy",  class: "Class 12 (Science)", subject: "Physics",     price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-chem", class: "Class 12 (Science)", subject: "Chemistry",   price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-math", class: "Class 12 (Science)", subject: "Mathematics", price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-bio",  class: "Class 12 (Science)", subject: "Biology",     price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-eng",  class: "Class 12 (Science)", subject: "English",     price: 800,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls12-sci-cs",   class: "Class 12 (Science)", subject: "Computer Sc.",price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-pcm",  class: "Class 12 (Science)", subject: "PCM Bundle",  price: 2400, originalPrice: 4197, duration: "1 Month", popular: true  },
  { id: "cls12-sci-pcb",  class: "Class 12 (Science)", subject: "PCB Bundle",  price: 2400, originalPrice: 4197, duration: "1 Month", popular: true  },

  // ── Class 12 — Commerce ───────────────────────────────────────────────────
  { id: "cls12-com-acc",  class: "Class 12 (Commerce)", subject: "Accountancy",       price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-eco",  class: "Class 12 (Commerce)", subject: "Economics",         price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-bst",  class: "Class 12 (Commerce)", subject: "Business Studies",  price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-math", class: "Class 12 (Commerce)", subject: "Mathematics",       price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-eng",  class: "Class 12 (Commerce)", subject: "English",           price: 800,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls12-com-ip",   class: "Class 12 (Commerce)", subject: "Informatics Pr.",   price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-core", class: "Class 12 (Commerce)", subject: "Core 3 (Acc+Eco+BSt)",price: 2400, originalPrice: 4197, duration: "1 Month", popular: true  },

  // ── Class 12 — Arts / Humanities ─────────────────────────────────────────
  { id: "cls12-arts-hist",  class: "Class 12 (Arts)", subject: "History",          price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-geo",   class: "Class 12 (Arts)", subject: "Geography",        price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-pol",   class: "Class 12 (Arts)", subject: "Political Science",price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-eco",   class: "Class 12 (Arts)", subject: "Economics",        price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-soci",  class: "Class 12 (Arts)", subject: "Sociology",        price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-psych", class: "Class 12 (Arts)", subject: "Psychology",       price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-eng",   class: "Class 12 (Arts)", subject: "English",          price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls12-arts-hin",   class: "Class 12 (Arts)", subject: "Hindi",            price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls12-arts-core",  class: "Class 12 (Arts)", subject: "Core 3 Subjects",  price: 2100, originalPrice: 3897, duration: "1 Month", popular: true  },
  { id: "cls12-arts-all",   class: "Class 12 (Arts)", subject: "Combined 5 Subjects",     price: 3500, originalPrice: 4000, duration: "1 Month", popular: false },

  // ── JEE (Mains + Advanced) ────────────────────────────────────────────────
  { id: "jee-phy",   class: "JEE", subject: "Physics",           price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "jee-chem",  class: "JEE", subject: "Chemistry",         price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "jee-math",  class: "JEE", subject: "Mathematics",       price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "jee-pcm",   class: "JEE", subject: "PCM Complete",      price: 3500, originalPrice: 3900, duration: "1 Month", popular: true  },

  // ── NEET ─────────────────────────────────────────────────────────────────
  { id: "neet-phy",   class: "NEET", subject: "Physics",          price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "neet-chem",  class: "NEET", subject: "Chemistry",        price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "neet-bio",   class: "NEET", subject: "Biology",          price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "neet-pcb",   class: "NEET", subject: "PCB Complete",     price: 3500, originalPrice: 3900, duration: "1 Month", popular: true  },

  // ── CUET ─────────────────────────────────────────────────────────────────
  { id: "cuet-eng",  class: "CUET", subject: "English",           price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-math", class: "CUET", subject: "Mathematics",       price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-gk",   class: "CUET", subject: "General Knowledge", price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-phy",  class: "CUET", subject: "Physics",           price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-chem", class: "CUET", subject: "Chemistry",         price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-bio",  class: "CUET", subject: "Biology",           price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-acc",  class: "CUET", subject: "Accountancy",       price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-eco",  class: "CUET", subject: "Economics",         price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-hist", class: "CUET", subject: "History",           price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-sci",  class: "CUET", subject: "Any 4 Subjects",price: 5000,originalPrice:5997, duration: "1 Month", popular: true  },

  // ── SSC ──────────────────────────────────────────────────────────────
  { id: "ssc-quant",  class: "SSC", subject: "Quantitative Aptitude", price: 1000, originalPrice: 1699, duration: "1 Month", popular: false },
  { id: "ssc-eng",    class: "SSC", subject: "English Language",      price: 1000, originalPrice: 1699, duration: "1 Month", popular: false },
  { id: "ssc-reason", class: "SSC", subject: "Reasoning",             price: 1000, originalPrice: 1699, duration: "1 Month", popular: false },
  { id: "ssc-gk",     class: "SSC", subject: "General Awareness",     price: 1000, originalPrice: 1699, duration: "1 Month", popular: false },
  { id: "ssc-all",    class: "SSC", subject: "Package for 3 Subjects",      price: 2700, originalPrice: 6596, duration: "1 Month", popular: true  },


  // ── NDA ──────────────────────────────────────────────────────────────────
  { id: "nda-math",  class: "NDA", subject: "Mathematics",         price: 1200, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "nda-gat",   class: "NDA", subject: "General Ability Test",price: 1200, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "nda-crash", class: "NDA", subject: "Crash Course",        price: 4000, originalPrice: 6999, duration: "3 Months", popular: false },


  // ── Olympiad / NTSE ───────────────────────────────────────────────────────
  { id: "olym-math", class: "Olympiad / NTSE", subject: "Mathematics",       price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "olym-sci",  class: "Olympiad / NTSE", subject: "Science",           price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "olym-eng",  class: "Olympiad / NTSE", subject: "English",           price: 700,  originalPrice: 1099, duration: "1 Month", popular: false },
  { id: "olym-gk",   class: "Olympiad / NTSE", subject: "GK & Mental Ability",price: 700, originalPrice: 1099, duration: "1 Month", popular: false },
  { id: "olym-all",  class: "Olympiad / NTSE", subject: "Complete Package",  price: 2800, originalPrice: 4996, duration: "1 Month", popular: true  },
];

export type Coupon = { type: "percent" | "flat"; value: number; label: string; minOrder: number }

export const COUPONS: Record<string, Coupon> = {
  SAVE20:   { type: "percent", value: 20,  label: "20% off on all orders",         minOrder: 500  },
  FLAT100:  { type: "flat",    value: 100, label: "₹100 off on orders above ₹500", minOrder: 500  },
  NEWJOIN:  { type: "percent", value: 15,  label: "15% off for new students",      minOrder: 0    },
  INTENSEL: { type: "percent", value: 25,  label: "25% off — exclusive code",      minOrder: 1000 },
};


export const MIN_ORDER = 200

export function priceCoupon(code: string, subtotal: number): { ok: true; code: string; discount: number; label: string } | { ok: false; error: string } {
  const upper = String(code || "").toUpperCase().trim()
  const coupon = COUPONS[upper]
  if (!coupon) return { ok: false, error: "Invalid coupon code" }
  if (subtotal < coupon.minOrder) return { ok: false, error: `Minimum order ₹${coupon.minOrder} required for this coupon` }
  const discount = coupon.type === "percent" ? Math.floor((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal)
  return { ok: true, code: upper, discount, label: coupon.label }
}
