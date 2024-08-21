import { expect } from "chai";
import hre from "hardhat";
import { EncryptedUint8, FhenixClient } from "fhenixjs";

type FheedleWord<T> = {
  l0: T;
  l1: T;
  l2: T;
  l3: T;
  l4: T;
};

hre.fhenixjs;

const wordToFheedleData = (word: string): FheedleWord<bigint> => {
  word = word.toUpperCase();
  return {
    l0: BigInt(word.charCodeAt(0)),
    l1: BigInt(word.charCodeAt(1)),
    l2: BigInt(word.charCodeAt(2)),
    l3: BigInt(word.charCodeAt(3)),
    l4: BigInt(word.charCodeAt(4)),
  };
};

const encryptFheedleWord = async (
  word: FheedleWord<bigint>,
  client: FhenixClient,
): Promise<FheedleWord<EncryptedUint8>> => {
  return {
    l0: await client.encrypt_uint8(parseInt(`${word.l0}`)),
    l1: await client.encrypt_uint8(parseInt(`${word.l1}`)),
    l2: await client.encrypt_uint8(parseInt(`${word.l2}`)),
    l3: await client.encrypt_uint8(parseInt(`${word.l3}`)),
    l4: await client.encrypt_uint8(parseInt(`${word.l4}`)),
  };
};

const unsealFheedleWord = (
  sealedWord: FheedleWord<string>,
  contractAddress: string,
  client: FhenixClient,
): FheedleWord<bigint> => {
  return {
    l0: client.unseal(contractAddress, sealedWord.l0),
    l1: client.unseal(contractAddress, sealedWord.l1),
    l2: client.unseal(contractAddress, sealedWord.l2),
    l3: client.unseal(contractAddress, sealedWord.l3),
    l4: client.unseal(contractAddress, sealedWord.l4),
  };
};

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
}
