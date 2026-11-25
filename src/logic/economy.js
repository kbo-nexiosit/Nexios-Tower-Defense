export function createWallet(start) {
  let tokens = start;
  return {
    get tokens() { return tokens; },
    earn(n) { tokens += n; },
    spend(n) { if (n > tokens) return false; tokens -= n; return true; },
  };
}
