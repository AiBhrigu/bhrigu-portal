import type {
  AmbiguousDateCandidate,
  BusinessSubjectPayload,
  DateRole,
  EventSubjectPayload,
  FormDataModel,
  MixedSubjectPayload,
  NormalizedDateEntry,
  NormalizedDatesModel,
  PersonSubjectPayload,
  ProjectSubjectPayload,
  RelationshipSubjectPayload,
  SubjectType,
} from "./access-models";

type ParseFlexibleDateResult =
  | { status: "parsed"; iso: string; human: string }
  | { status: "ambiguous"; candidates: AmbiguousDateCandidate[] }
  | { status: "empty" };

export function buildNormalizedDates(
  formData: FormDataModel
): NormalizedDatesModel {
  const { subjectType } = formData.request;
  const subjectPayload = formData.subjectPayload;
  const dates: NormalizedDateEntry[] = [];

  const pushDate = (input: {
    id: string;
    role: DateRole;
    label: string;
    raw: string | null | undefined;
    required: boolean;
  }) => {
    const raw = (input.raw ?? "").trim();

    if (!raw) {
      dates.push({
        id: input.id,
        role: input.role,
        label: input.label,
        raw: null,
        iso: null,
        human: null,
        status: "empty",
        required: input.required,
        confirmed: false,
        ambiguousCandidates: [],
      });
      return;
    }

    const parsed = parseFlexibleDate(raw);

    if (parsed.status === "ambiguous") {
      dates.push({
        id: input.id,
        role: input.role,
        label: input.label,
        raw,
        iso: null,
        human: null,
        status: "ambiguous",
        required: input.required,
        confirmed: false,
        ambiguousCandidates: parsed.candidates,
      });
      return;
    }

    if (parsed.status === "parsed") {
      dates.push({
        id: input.id,
        role: input.role,
        label: input.label,
        raw,
        iso: parsed.iso,
        human: parsed.human,
        status: "parsed",
        required: input.required,
        confirmed: false,
        ambiguousCandidates: [],
      });
      return;
    }

    dates.push({
      id: input.id,
      role: input.role,
      label: input.label,
      raw,
      iso: null,
      human: null,
      status: "empty",
      required: input.required,
      confirmed: false,
      ambiguousCandidates: [],
    });
  };

  if (subjectType === "Person") {
    const p = subjectPayload as PersonSubjectPayload;
    pushDate({
      id: "birth_date_primary",
      role: "birth_date",
      label: "Date of birth",
      raw: p.birthDateRaw,
      required: true,
    });
  }

  if (subjectType === "Relationship") {
    const p = subjectPayload as RelationshipSubjectPayload;
    pushDate({
      id: "person_a_birth_date",
      role: "person_a_birth_date",
      label: "Person A date of birth",
      raw: p.personA.birthDateRaw,
      required: true,
    });
    pushDate({
      id: "person_b_birth_date",
      role: "person_b_birth_date",
      label: "Person B date of birth",
      raw: p.personB.birthDateRaw,
      required: true,
    });
    pushDate({
      id: "relationship_start_date",
      role: "relationship_start_date",
      label: "Relationship start date",
      raw: p.relationshipStartDateRaw,
      required: false,
    });
  }

  if (subjectType === "Project") {
    const p = subjectPayload as ProjectSubjectPayload;
    pushDate({
      id: "project_start_date",
      role: "project_start_date",
      label: "Start date",
      raw: p.startDateRaw,
      required: true,
    });
    pushDate({
      id: "milestone_date",
      role: "milestone_date",
      label: "Key milestone date",
      raw: p.milestoneDateRaw,
      required: false,
    });
  }

  if (subjectType === "Business / Organization") {
    const p = subjectPayload as BusinessSubjectPayload;
    pushDate({
      id: "registration_date",
      role: "registration_date",
      label: "Registration or start date",
      raw: p.registrationOrStartDateRaw,
      required: true,
    });
    pushDate({
      id: "key_event_date",
      role: "key_event_date",
      label: "Key event date",
      raw: p.keyEventDateRaw,
      required: false,
    });
  }

  if (subjectType === "Event / Period") {
    const p = subjectPayload as EventSubjectPayload;
    pushDate({
      id: "event_date",
      role: "event_date",
      label: "Event date",
      raw: p.eventDateRaw,
      required: false,
    });
    pushDate({
      id: "period_start",
      role: "period_start",
      label: "Period start",
      raw: p.periodStartRaw,
      required: true,
    });
    pushDate({
      id: "period_end",
      role: "period_end",
      label: "Period end",
      raw: p.periodEndRaw,
      required: false,
    });
  }

  if (subjectType === "Mixed / Not sure") {
    const p = subjectPayload as MixedSubjectPayload;
    const extracted = extractLooseDates(p.knownDatesRaw);
    extracted.forEach((raw, index) => {
      pushDate({
        id: `custom_known_date_${index + 1}`,
        role: "custom_known_date",
        label: `Known date ${index + 1}`,
        raw,
        required: false,
      });
    });
  }

  return { dates };
}

export function resolveAmbiguousDate(
  normalizedDates: NormalizedDatesModel,
  dateId: string,
  selectedIso: string
): NormalizedDatesModel {
  return {
    dates: normalizedDates.dates.map((d) => {
      if (d.id !== dateId) return d;

      const candidate = d.ambiguousCandidates.find((c) => c.iso === selectedIso);
      if (!candidate) return d;

      return {
        ...d,
        iso: candidate.iso,
        human: candidate.human,
        status: "parsed",
        ambiguousCandidates: [],
      };
    }),
  };
}

export function confirmAllParsedDates(
  normalizedDates: NormalizedDatesModel
): NormalizedDatesModel {
  return {
    dates: normalizedDates.dates.map((d) => {
      if (d.status === "parsed") {
        return {
          ...d,
          status: "confirmed",
          confirmed: true,
        };
      }
      return d;
    }),
  };
}

export function parseFlexibleDate(rawInput: string): ParseFlexibleDateResult {
  const raw = rawInput.trim();
  if (!raw) return { status: "empty" };

  const isoLike = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoLike) {
    const iso = `${isoLike[1]}-${isoLike[2]}-${isoLike[3]}`;
    if (!isPlausibleIsoDate(iso)) return { status: "empty" };
    return {
      status: "parsed",
      iso,
      human: formatHumanDate(iso),
    };
  }

  const named = tryParseNamedMonth(raw);
  if (named) {
    return {
      status: "parsed",
      iso: named,
      human: formatHumanDate(named),
    };
  }

  const slash = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const year = normalizeYear(slash[3]);

    if (a < 1 || b < 1) return { status: "empty" };

    if (a <= 12 && b <= 12) {
      const ddmmyyyy = toIso(year, b, a);
      const mmddyyyy = toIso(year, a, b);

      if (
        isPlausibleIsoDate(ddmmyyyy) &&
        isPlausibleIsoDate(mmddyyyy) &&
        ddmmyyyy !== mmddyyyy
      ) {
        return {
          status: "ambiguous",
          candidates: [
            { iso: ddmmyyyy, human: formatHumanDate(ddmmyyyy) },
            { iso: mmddyyyy, human: formatHumanDate(mmddyyyy) },
          ],
        };
      }
    }

    const iso = toIso(year, b, a);
    if (!isPlausibleIsoDate(iso)) return { status: "empty" };

    return {
      status: "parsed",
      iso,
      human: formatHumanDate(iso),
    };
  }

  return { status: "empty" };
}

export function tryParseNamedMonth(raw: string): string | null {
  const months: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  const cleaned = raw
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned.split(" ");
  if (parts.length !== 3) return null;

  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  for (const p of parts) {
    if (/^\d{1,2}$/.test(p) && day === null) {
      day = Number(p);
      continue;
    }

    if (months[p] && month === null) {
      month = months[p];
      continue;
    }

    if (/^\d{2,4}$/.test(p) && year === null) {
      year = normalizeYear(p);
    }
  }

  if (!day || !month || !year) return null;

  const iso = toIso(year, month, day);
  return isPlausibleIsoDate(iso) ? iso : null;
}

export function normalizeYear(value: string): number {
  const year = Number(value);

  if (value.length === 2) {
    return year >= 50 ? 1900 + year : 2000 + year;
  }

  return year;
}

export function toIso(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function formatHumanDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${day} ${months[month - 1]} ${year}`;
}

export function extractLooseDates(text: string): string[] {
  if (!text?.trim()) return [];

  const matches = text.match(
    /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g
  );

  return matches ?? [];
}

export function isPlausibleIsoDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;

  const [year, month, day] = iso.split("-").map(Number);
  if (year < 1000 || year > 3000) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function getRequiredDateRolesForSubjectType(
  subjectType: SubjectType | ""
): DateRole[] {
  switch (subjectType) {
    case "Person":
      return ["birth_date"];
    case "Relationship":
      return ["person_a_birth_date", "person_b_birth_date"];
    case "Project":
      return ["project_start_date"];
    case "Business / Organization":
      return ["registration_date"];
    case "Event / Period":
      return ["period_start"];
    case "Mixed / Not sure":
    default:
      return [];
  }
}
