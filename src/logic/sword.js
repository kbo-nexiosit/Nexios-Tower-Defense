// The Nexios Sword: one charge, earned by clearing a wave with zero leaks.
// A wave cleared by using the sword never re-grants it.
export function createSword() {
  let charges = 0, usedThisWave = false;
  return {
    get charges() { return charges; },
    // Returns true when this clear newly granted the sword.
    onWaveCleared(leaks) {
      const used = usedThisWave;
      usedThisWave = false;
      if (used || leaks !== 0 || charges >= 1) return false;
      charges = 1;
      return true;
    },
    use() {
      if (charges < 1) return false;
      charges = 0;
      usedThisWave = true;
      return true;
    },
  };
}
