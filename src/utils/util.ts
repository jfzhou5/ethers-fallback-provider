export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const requires = (check: boolean | unknown, msg?: string) => {
  if (!check) throw Error(msg || "check failed in requires.");
};
