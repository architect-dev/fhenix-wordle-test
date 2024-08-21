import { Counter, Fheedle } from "../types";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import {
  encryptWordForFheedle,
  FheedleGuessWithResult,
  FheedleResult,
  FheedleWord,
  unsealFheedleWord,
  unsealFheedleWordAsString,
  unsealUserResultGuesses,
} from "../utils/fheedle";
import { FhenixClient } from "fhenixjs";
import * as readline from "readline/promises";

task("task:fheedle:addWord")
  .addParam("word", "Word to guess", "HELLO")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { fhenixjs, ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    if ((await ethers.provider.getBalance(signer.address)).toString() === "0") {
      await fhenixjs.getFunds(signer.address);
    }

    const wordToAdd = taskArguments.word.toUpperCase();
    const encWord = await encryptWordForFheedle(
      wordToAdd,
      fhenixjs as unknown as FhenixClient,
    );

    const Fheedle = await deployments.get("Fheedle");

    console.log(`Adding the word ${wordToAdd} to Fheedle`);

    const contract = await ethers.getContractAt("Fheedle", Fheedle.address);

    let contractWithSigner = contract.connect(signer) as unknown as Fheedle;

    try {
      // add() gets `bytes calldata encryptedValue`
      // therefore we need to pass in the `data` property
      await contractWithSigner.addWord(encWord);
      console.log("Done!");
    } catch (e) {
      console.log(`Failed to send addWord transaction: ${e}`);
      return;
    }
  });

task("task:fheedle:getWord").setAction(async function (
  _taskArguments: TaskArguments,
  hre,
) {
  const { fhenixjs, ethers, deployments } = hre;
  const [signer] = await ethers.getSigners();

  const Fheedle = await deployments.get("Fheedle");

  const contract = await ethers.getContractAt("Fheedle", Fheedle.address);

  let permit = await fhenixjs.generatePermit(
    Fheedle.address,
    undefined, // use the internal provider
    signer,
  );

  const wordIndex = (await contract.numberOfWords()) - 1n;

  const sealedWord = await contract.getSealedWord(permit, wordIndex);
  const unsealedWord = unsealFheedleWordAsString(
    sealedWord,
    Fheedle.address,
    fhenixjs as unknown as FhenixClient,
  );

  console.log(`Unsealed active word: ${unsealedWord}`);
});

///////////////
// PLAY
///////////////

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
let keyboard: { [key: string]: string } = {};
"QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach((char) => {
  keyboard[char] = colorText(char, RESET);
});

function printDisplayGridAndKeyboard(
  guesses: FheedleGuessWithResult<bigint>[],
): void {
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
}

task("task:fheedle:play").setAction(async function (
  _taskArguments: TaskArguments,
  hre,
) {
  const { fhenixjs, ethers, deployments } = hre;
  const [signer] = await ethers.getSigners();

  if ((await ethers.provider.getBalance(signer.address)).toString() === "0") {
    await fhenixjs.getFunds(signer.address);
  }

  const Fheedle = await deployments.get("Fheedle");

  const contract = await ethers.getContractAt("Fheedle", Fheedle.address);
  const contractWithSigner = contract.connect(signer) as unknown as Fheedle;
  const wordIndex = (await contract.numberOfWords()) - 1n;

  let permit = await fhenixjs.generatePermit(
    Fheedle.address,
    undefined, // use the internal provider
    signer,
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let playing = true;

  while (playing) {
    const userResult = await contract.getSealedUserResult(permit, wordIndex);

    const unsealedGuesses = unsealUserResultGuesses(
      userResult.guesses,
      Fheedle.address,
      fhenixjs as unknown as FhenixClient,
    );

    printDisplayGridAndKeyboard(unsealedGuesses);

    if (unsealedGuesses.length >= 6) {
      console.log("You've run out of guesses, better luck next time");
      playing = false;
    }

    if (userResult.gotItIn > 0) {
      console.log(
        `Congratulations, you got it in ${userResult.gotItIn} guesses!`,
      );
      playing = false;
    }

    if (playing) {
      let validGuess = true;
      let guess = "";
      do {
        guess = await rl.question("What is your guess:\n");
        validGuess = true;

        if (guess.length != 5) {
          validGuess = false;
          console.log("Must be 5 letters long\n\n");
        }

        if (!/^[a-zA-Z]+$/.test(guess)) {
          validGuess = false;
          console.log("Must only be letters\n\n");
        }
      } while (validGuess != true);

      console.log(`Checking guess: ${guess}........`);

      const encWord = await encryptWordForFheedle(
        guess,
        fhenixjs as unknown as FhenixClient,
      );

      try {
        await contractWithSigner.makeGuess(wordIndex, encWord);
      } catch (e) {
        console.log(`makeGuess tx failed: ${e}`);
        return;
      }
    }
  }

  rl.close();
});
