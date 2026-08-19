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

export type Flag = {
  id: string;
  tag: string;
  where: string;
  assumed: string;
  why: string;
  fixes: { key: string; label: string; result: string }[];
};

export type DraftRound = {
  coverage: number;
  headline: string;
  note: string;
  flags: Flag[];
  ripple: { name: string; note: string }[];
};

export type Fork = {
  id: string;
  kicker: string;
  question: string;
  why: string;
  options: { key: string; label: string; tail: string; effects: { sign: string; text: string }[] }[];
};

export type ForkRound = {
  coverage: number;
  headline: string;
  forks: Fork[];
  inferred: { k: string; v: string; why: string }[];
};
