// The Nexios Sword: one charge, earned by clearing a wave with zero leaks.
export function createSword() {
  let charges = 0;
  return {
    get charges() { return charges; },
    // Returns true when this clear newly granted the sword.
    onWaveCleared(leaks) {
      if (leaks !== 0 || charges >= 1) return false;
      charges = 1;
      return true;
    },
    use() {
      if (charges < 1) return false;
      charges = 0;
      return true;
    },
  };
}
