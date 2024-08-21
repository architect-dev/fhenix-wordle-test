import {
  FheedleGuessWithResult,
  FheedleWord,
  FheedleResult,
} from "../utils/fheedle";

function bigintToChar(b: bigint): string {
  return String.fromCharCode(Number(b));
}

const BOLD = "\x1b[1m";
const GREEN = "\x1b[92m";
const YELLOW = "\x1b[93m";
const GRAY = "\x1b[90m";
const RESET = "\x1b[0m";

const colorText = (letter: string, color: string, bold = true): string => {
  return `${color}${bold ? BOLD : ""}${letter}${RESET}`;
};

// Initial keyboard state
export const keyboard: { [key: string]: string } = {};
"QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach((char) => {
  keyboard[char] = colorText(char, RESET);
});

export const printDisplayGridAndKeyboard = (
  guesses: FheedleGuessWithResult<bigint>[],
) => {
  const grid: string[] = [];

  guesses.forEach((guessWithResult) => {
    const guess = guessWithResult.guess;
    const result = guessWithResult.result;
    let row = "";

    for (let i = 0; i < 5; i++) {
      const letter = bigintToChar(guess[`l${i}` as keyof FheedleWord<bigint>]);

      if (result[`green${i}` as keyof FheedleResult]) {
        row += colorText(letter, GREEN);
        keyboard[letter] = colorText(letter, GREEN);
      } else if (result[`yellow${i}` as keyof FheedleResult]) {
        row += colorText(letter, YELLOW);
        if (keyboard[letter] !== colorText(letter, GREEN)) {
          keyboard[letter] = colorText(letter, YELLOW);
        }
      } else {
        row += colorText(letter, GRAY, false);
        if (
          keyboard[letter] !== colorText(letter, GREEN) &&
          keyboard[letter] !== colorText(letter, YELLOW)
        ) {
          keyboard[letter] = colorText(letter, GRAY, false);
        }
      }

      if (i < 4) {
        row += " │ ";
      }
    }
    grid.push(row);
  });

  // Print the grid
  console.log("   ┌───┬───┬───┬───┬───┐");
  for (let i = 0; i < 6; i++) {
    if (i < grid.length) {
      console.log(`   │ ${grid[i]} │`);
    } else if (i == grid.length) {
      console.log(` ➤ │   │   │   │   │   │`);
    } else {
      console.log(`   │   │   │   │   │   │`);
    }
    if (i < 5) {
      console.log("   ├───┼───┼───┼───┼───┤");
    }
  }
  console.log("   └───┴───┴───┴───┴───┘");

  // Print the keyboard
  console.log(
    ` ${keyboard["Q"]}  ${keyboard["W"]}  ${keyboard["E"]}  ${keyboard["R"]}  ${keyboard["T"]}  ${keyboard["Y"]}  ${keyboard["U"]}  ${keyboard["I"]}  ${keyboard["O"]}  ${keyboard["P"]}\n` +
      `  ${keyboard["A"]}  ${keyboard["S"]}  ${keyboard["D"]}  ${keyboard["F"]}  ${keyboard["G"]}  ${keyboard["H"]}  ${keyboard["J"]}  ${keyboard["K"]}  ${keyboard["L"]}\n` +
      `   ${keyboard["Z"]}  ${keyboard["X"]}  ${keyboard["C"]}  ${keyboard["V"]}  ${keyboard["B"]}  ${keyboard["N"]}  ${keyboard["M"]}`,
  );

  console.log("\n\n");
};
