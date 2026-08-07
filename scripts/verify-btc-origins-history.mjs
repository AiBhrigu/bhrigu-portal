import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const route = read("lib/btc-cosmographer-route-graph.ts");
const protocol = read("lib/btc-protocol-evidence.ts");
const dialogue = read("components/btc/BtcCosmographerDialogue.tsx");
const checks = {
  subjects_present: ["satoshi_history", "bitcoin_origin", "genesis_history"].every((value) => route.includes(`return "${value}"`)),
  existing_domain_reused: route.includes('if (protocol) return "bitcoin_protocol";'),
  capsule_layers: ["timeline", "sources", "known", "supported_inference", "disputed", "unknown_boundary"].every((value) => protocol.includes(`${value}:`)),
  ru_questions_five: (protocol.match(/subject: "(?:satoshi_history|bitcoin_origin|genesis_history)",/g) || []).length === 10,
  prepared_matrix_exported: protocol.includes("BTC_ORIGINS_PREPARED_QUESTIONS") && protocol.includes("Как появился Bitcoin") && protocol.includes("How did Bitcoin emerge"),
  primary_sources_six: (protocol.match(/id: "(?:mailing_list_announcement|white_paper|first_release_archive|genesis_source_code|last_public_post|final_handoff_email)"/g) || []).length === 6,
  answer_structure: ["timeline", "significance", "known", "supported_inference", "disputed", "unknown_boundary", "sources"].every((value) => protocol.includes(`id: "${value}"`)),
  prepared_surface: dialogue.includes('data-bitcoin-origins-prepared="secondary"') && dialogue.includes("BTC_ORIGINS_PREPARED_QUESTIONS[locale].map"),
  collapsible_sources: dialogue.includes('data-origin-source-list="true"') && dialogue.includes("<details className=\"answerDisclosure answerSourceList\""),
  public_subject_labels: ["История Сатоши", "Происхождение Bitcoin", "История Genesis"].every((value) => dialogue.includes(value)),
  visible_authority_ids_removed: dialogue.includes('className="answerAuthority">{publicSubjectLabel') && !dialogue.includes("Evidence ·") && !dialogue.includes("Bridge result ·"),
  no_new_database: !protocol.includes("database") && !protocol.includes("prisma") && !protocol.includes("postgres"),
  no_new_product_mode: !route.includes('"bitcoin_history"') && !route.includes('"satoshi_mode"'),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
console.log(JSON.stringify({ schema: "btc_origins_history_static_acceptance_v0_1", checks, failed }, null, 2));
if (failed.length) process.exit(1);
