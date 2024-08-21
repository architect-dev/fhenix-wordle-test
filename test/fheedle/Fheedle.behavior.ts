import { expect } from "chai";
import hre from "hardhat";
import {
  wordToFheedleData,
  encryptFheedleWord,
  unsealFheedleWord,
} from "../../utils/fheedle";

export function shouldBehaveLikeFheedle(): void {
  it("should add word to list of words", async function () {
    const word = wordToFheedleData("HELLO");
    const encWord = await encryptFheedleWord(word, this.instance.instance);

    const numberOfWordsInit = await this.fheedle.numberOfWords();

    await this.fheedle.connect(this.signers.admin).addWord(encWord);

    const numberOfWordsFinal = await this.fheedle.numberOfWords();
    expect(numberOfWordsFinal === numberOfWordsInit + 1n);

    const sealedWord = await this.fheedle
      .connect(this.signers.admin)
      .getSealedWord(this.instance.permission, 0);
    const contractAddress = await this.fheedle.getAddress();

    const unsealedWord = unsealFheedleWord(
      sealedWord,
      contractAddress,
      this.instance.instance,
    );

    expect(word === unsealedWord, "Original and unsealed words should match");
  });

  it("should check letters correctly", async function () {
    const word = wordToFheedleData("HELLO");
    const encWord = await encryptFheedleWord(word, this.instance.instance);
    await this.fheedle.connect(this.signers.admin).addWord(encWord);

    const guess = wordToFheedleData("WORLD");
    const encGuess = await encryptFheedleWord(guess, this.instance.instance);
    await this.fheedle.makeGuess(0, encGuess);

    const userResult = await this.fheedle
      .connect(this.signers.admin)
      .getSealedUserResult(this.instance.permission, 0);
    const contractAddress = await this.fheedle.getAddress();

    const unsealedGuess = unsealFheedleWord(
      userResult.guesses[0].guess,
      contractAddress,
      this.instance.instance,
    );

    expect(
      guess === unsealedGuess,
      "Original and unsealed guesses should match",
    );

    // HELLO
    // WORLD
    // The O should be marked yellow
    // The L should be marked green

    expect(
      userResult.guesses[0].result.green1 === false,
      "'O' not in correct place",
    );
    expect(
      userResult.guesses[0].result.yellow1 === true,
      "'O' i in target word",
    );
    expect(
      userResult.guesses[0].result.green1 === true,
      "'L' is in correct place",
    );

    expect(userResult.gotItIn === 0n, "Should not have completed the game");
  });
}
