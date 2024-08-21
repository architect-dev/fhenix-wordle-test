import { Fheedle } from "../types";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import {
  encryptWordForFheedle,
  unsealFheedleWordAsString,
  unsealUserResultGuesses,
} from "../utils/fheedle";
import { FhenixClient } from "fhenixjs";
import * as readline from "readline/promises";
import { printDisplayGridAndKeyboard } from "./fheedlePlayCLIUtils";

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

    // Game End Conditions

    if (unsealedGuesses.length >= 6) {
      console.log("You've run out of guesses, better luck next time");
      playing = false;
      continue;
    }

    if (userResult.gotItIn > 0) {
      console.log(
        `Congratulations, you got it in ${userResult.gotItIn} guesses!`,
      );
      playing = false;
      continue;
    }

    // Continue Playing Game

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

    console.log(`\n\nChecking guess: ${guess}........`);

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

  rl.close();
});
