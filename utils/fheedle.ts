import { EncryptedUint8, FhenixClient } from "fhenixjs";

export type FheedleWord<T> = {
  l0: T;
  l1: T;
  l2: T;
  l3: T;
  l4: T;
};

export type FheedleResult = {
  green0: boolean;
  yellow0: boolean;
  green1: boolean;
  yellow1: boolean;
  green2: boolean;
  yellow2: boolean;
  green3: boolean;
  yellow3: boolean;
  green4: boolean;
  yellow4: boolean;
};

export type FheedleGuessWithResult<T> = {
  guess: FheedleWord<T>;
  result: FheedleResult;
};

export const wordToFheedleData = (word: string): FheedleWord<bigint> => {
  word = word.toUpperCase();
  return {
    l0: BigInt(word.charCodeAt(0)),
    l1: BigInt(word.charCodeAt(1)),
    l2: BigInt(word.charCodeAt(2)),
    l3: BigInt(word.charCodeAt(3)),
    l4: BigInt(word.charCodeAt(4)),
  };
};

export const encryptFheedleWord = async (
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

export const encryptWordForFheedle = async (
  word: string,
  client: FhenixClient,
): Promise<FheedleWord<EncryptedUint8>> => {
  return encryptFheedleWord(wordToFheedleData(word), client);
};

export const unsealFheedleWord = (
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

export const unsealFheedleWordAsString = (
  sealedWord: FheedleWord<string>,
  contractAddress: string,
  client: FhenixClient,
): string => {
  const unsealedWord = unsealFheedleWord(sealedWord, contractAddress, client);
  return String.fromCharCode(
    parseInt(`${unsealedWord.l0}`),
    parseInt(`${unsealedWord.l1}`),
    parseInt(`${unsealedWord.l2}`),
    parseInt(`${unsealedWord.l3}`),
    parseInt(`${unsealedWord.l4}`),
  );
};

export const unsealUserResultGuesses = (
  guesses: Array<FheedleGuessWithResult<string>>,
  contractAddress: string,
  client: FhenixClient,
): Array<FheedleGuessWithResult<bigint>> => {
  return guesses.map((guess) => ({
    guess: unsealFheedleWord(guess.guess, contractAddress, client),
    result: guess.result,
  }));
};
