export type Correction = {
  flagId: string;
  where: string;
  assumed: string;
  choice: string;
  result?: string | undefined;
};

export type Decision = {
  forkId: string;
  question: string;
  choice: string;
};

export type GlossaryEntry = { term: string; definition: string };

export type Flag = {
  id: string;
  tag: string;
  where: string;
  assumed: string;
  plain?: string;
  why: string;
  fixes: { key: string; label: string; result: string; plainResult?: string }[];
};

export type DraftRound = {
  coverage: number;
  headline: string;
  note: string;
  plainNote?: string;
  flags: Flag[];
  ripple: { name: string; note: string }[];
  glossary?: GlossaryEntry[];
};

export type Fork = {
  id: string;
  kicker: string;
  question: string;
  why: string;
  plain?: string;
  options: {
    key: string;
    label: string;
    tail: string;
    plainTail?: string;
    effects: { sign: string; text: string }[];
  }[];
};

export type ForkRound = {
  coverage: number;
  headline: string;
  forks: Fork[];
  inferred: { k: string; v: string; why: string }[];
  glossary?: GlossaryEntry[];
};
