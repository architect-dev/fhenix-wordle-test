// SPDX-License-Identifier: MIT

pragma solidity >=0.8.13 <0.9.0;

import "@fhenixprotocol/contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/contracts/access/Permissioned.sol";

// Problems to solve:
// . How to store letters in word
// . Word checking
// . . Check if letter in correct position
// . . Check if letter anywhere in word
// . Each FHE.eq check costs 40000 gas, to check every input letter against every word letter is 25 checks
// . .

// Check if letter matches in correct position first (green)
// If not, check if letter exists in any position (yellow)

// Questions that have come up:
// . Can euints be inserted into a struct, how much data do they consume in the struct
// . Is it possible to return complex data structures, or only individual items

struct InFheedleWord {
  inEuint8 l0;
  inEuint8 l1;
  inEuint8 l2;
  inEuint8 l3;
  inEuint8 l4;
}

struct FheedleWord {
  euint8 l0;
  euint8 l1;
  euint8 l2;
  euint8 l3;
  euint8 l4;
}
struct FheedleWordResult {
  bool green0;
  bool yellow0;
  bool green1;
  bool yellow1;
  bool green2;
  bool yellow2;
  bool green3;
  bool yellow3;
  bool green4;
  bool yellow4;
}
struct FheedleGuessWithResult {
  FheedleWord guess;
  FheedleWordResult result;
}
struct FheedleGameResult {
  FheedleGuessWithResult[] guesses;
  uint8 gotItIn;
}

struct SealedFheedleWord {
  string l0;
  string l1;
  string l2;
  string l3;
  string l4;
}
struct SealedFheedleGuessWithResult {
  SealedFheedleWord guess;
  FheedleWordResult result;
}
struct SealedFheedleGameResult {
  SealedFheedleGuessWithResult[] guesses;
  uint8 gotItIn;
}

contract Fheedle is Permissioned {
  euint32 private counter;
  address public owner;

  mapping(uint32 => FheedleWord) public words;

  uint32 public numberOfWords;

  mapping(address => mapping(uint32 => FheedleGameResult)) public userResults;

  constructor() {
    owner = msg.sender;
  }

  error OutOfGuesses();
  error AlreadyGuessedCorrectly();

  function _processInWord(
    InFheedleWord memory inWord
  ) internal view returns (FheedleWord memory processedWord) {
    processedWord = FheedleWord({
      l0: FHE.asEuint8(inWord.l0),
      l1: FHE.asEuint8(inWord.l1),
      l2: FHE.asEuint8(inWord.l2),
      l3: FHE.asEuint8(inWord.l3),
      l4: FHE.asEuint8(inWord.l4)
    });
  }

  function addWord(
    InFheedleWord calldata inWord
  ) public returns (uint32 wordIndex) {
    wordIndex = numberOfWords;
    words[wordIndex] = _processInWord(inWord);
    numberOfWords += 1;
  }

  function _checkGuess(
    uint32 wordIndex,
    FheedleWord memory guess
  ) internal view returns (FheedleWordResult memory wordResult, bool correct) {
    FheedleWord memory word = words[wordIndex];

    // Matches are a single comparison, thus less expensive

    wordResult.green0 = FHE.decrypt(guess.l0.eq(word.l0));
    wordResult.green1 = FHE.decrypt(guess.l1.eq(word.l1));
    wordResult.green2 = FHE.decrypt(guess.l2.eq(word.l2));
    wordResult.green3 = FHE.decrypt(guess.l3.eq(word.l3));
    wordResult.green4 = FHE.decrypt(guess.l4.eq(word.l4));

    // Characters that have matched should be excluded from yellow checking
    // This looks inefficient, but the gas cost of these checks is less than the savings
    uint8 toCheckCount;
    if (!wordResult.green0) toCheckCount += 1;
    if (!wordResult.green1) toCheckCount += 1;
    if (!wordResult.green2) toCheckCount += 1;
    if (!wordResult.green3) toCheckCount += 1;
    if (!wordResult.green4) toCheckCount += 1;

    uint8 i = 0;
    euint8[] memory toCheck = new euint8[](toCheckCount);
    if (!wordResult.green0) {
      toCheck[i] = word.l0;
      i += 1;
    }
    if (!wordResult.green1) {
      toCheck[i] = word.l1;
      i += 1;
    }
    if (!wordResult.green2) {
      toCheck[i] = word.l2;
      i += 1;
    }
    if (!wordResult.green3) {
      toCheck[i] = word.l3;
      i += 1;
    }
    if (!wordResult.green4) {
      toCheck[i] = word.l4;
      i += 1;
    }

    correct = toCheck.length == 0;

    if (toCheck.length >= 2) {
      uint256 i;
      ebool tempYellow;

      if (!wordResult.green0) {
        tempYellow = FHE.asEbool(false);
        for (i = 0; i < toCheck.length; i++) {
          if (i == 0) continue;
          tempYellow = tempYellow.or(guess.l0.eq(toCheck[i]));
        }
        wordResult.yellow0 = FHE.decrypt(tempYellow);
      }

      if (!wordResult.green1) {
        tempYellow = FHE.asEbool(false);
        for (i = 0; i < toCheck.length; i++) {
          if (i == 1) continue;
          tempYellow = tempYellow.or(guess.l1.eq(toCheck[i]));
        }
        wordResult.yellow1 = FHE.decrypt(tempYellow);
      }

      if (!wordResult.green2) {
        tempYellow = FHE.asEbool(false);
        for (i = 0; i < toCheck.length; i++) {
          if (i == 2) continue;
          tempYellow = tempYellow.or(guess.l2.eq(toCheck[i]));
        }
        wordResult.yellow2 = FHE.decrypt(tempYellow);
      }

      if (!wordResult.green3) {
        tempYellow = FHE.asEbool(false);
        for (i = 0; i < toCheck.length; i++) {
          if (i == 3) continue;
          tempYellow = tempYellow.or(guess.l3.eq(toCheck[i]));
        }
        wordResult.yellow3 = FHE.decrypt(tempYellow);
      }

      if (!wordResult.green4) {
        tempYellow = FHE.asEbool(false);
        for (i = 0; i < toCheck.length; i++) {
          if (i == 4) continue;
          tempYellow = tempYellow.or(guess.l4.eq(toCheck[i]));
        }
        wordResult.yellow4 = FHE.decrypt(tempYellow);
      }
    }
  }
  // function _checkGuess(
  //   uint32 wordIndex,
  //   FheedleWord memory guess
  // ) internal view returns (FheedleWordResult memory wordResult, bool correct) {
  //   FheedleWord memory word = words[wordIndex];

  //   // Matches are a single comparison, thus less expensive

  //   wordResult.green0 = guess.l0.eq(word.l0);
  //   wordResult.green1 = guess.l1.eq(word.l1);
  //   wordResult.green2 = guess.l2.eq(word.l2);
  //   wordResult.green3 = guess.l3.eq(word.l3);
  //   wordResult.green4 = guess.l4.eq(word.l4);

  //   wordResult.yellow0 = guess
  //     .l0
  //     .eq(word.l1)
  //     .or(guess.l0.eq(word.l2))
  //     .or(guess.l0.eq(word.l3))
  //     .or(guess.l0.eq(word.l4));

  //   wordResult.yellow1 = guess
  //     .l1
  //     .eq(word.l0)
  //     .or(guess.l1.eq(word.l2))
  //     .or(guess.l1.eq(word.l3))
  //     .or(guess.l1.eq(word.l4));

  //   wordResult.yellow2 = guess
  //     .l2
  //     .eq(word.l0)
  //     .or(guess.l2.eq(word.l1))
  //     .or(guess.l2.eq(word.l3))
  //     .or(guess.l2.eq(word.l4));

  //   wordResult.yellow3 = guess
  //     .l3
  //     .eq(word.l0)
  //     .or(guess.l3.eq(word.l1))
  //     .or(guess.l3.eq(word.l2))
  //     .or(guess.l3.eq(word.l4));

  //   wordResult.yellow4 = guess
  //     .l4
  //     .eq(word.l0)
  //     .or(guess.l4.eq(word.l1))
  //     .or(guess.l4.eq(word.l2))
  //     .or(guess.l4.eq(word.l3));
  // }

  function makeGuess(
    uint32 wordIndex,
    InFheedleWord calldata inGuess
  ) public returns (FheedleWordResult memory wordResult, bool correct) {
    FheedleGameResult storage userResult = userResults[msg.sender][wordIndex];

    if (userResult.gotItIn != 0) revert AlreadyGuessedCorrectly();

    uint8 userGuessCount = uint8(userResult.guesses.length);
    if (userGuessCount == 6) revert OutOfGuesses();

    FheedleWord memory guess = _processInWord(inGuess);

    (wordResult, correct) = _checkGuess(wordIndex, guess);

    userResult.guesses.push(
      FheedleGuessWithResult({guess: guess, result: wordResult})
    );

    if (correct) {
      userResult.gotItIn = uint8(userResult.guesses.length);
    }
  }

  function _sealWord(
    FheedleWord memory word,
    bytes32 publicKey
  ) internal view returns (SealedFheedleWord memory sealedWord) {
    sealedWord = SealedFheedleWord({
      l0: FHE.sealoutput(word.l0, publicKey),
      l1: FHE.sealoutput(word.l1, publicKey),
      l2: FHE.sealoutput(word.l2, publicKey),
      l3: FHE.sealoutput(word.l3, publicKey),
      l4: FHE.sealoutput(word.l4, publicKey)
    });
  }

  function getSealedUserResult(
    Permission memory permission,
    uint32 wordIndex
  )
    public
    view
    onlySender(permission)
    returns (SealedFheedleGameResult memory sealedResult)
  {
    FheedleGameResult storage userResult = userResults[msg.sender][wordIndex];

    sealedResult.gotItIn = userResult.gotItIn;

    sealedResult.guesses = new SealedFheedleGuessWithResult[](
      userResult.guesses.length
    );

    for (uint8 i = 0; i < uint8(userResult.guesses.length); i++) {
      sealedResult.guesses[i] = SealedFheedleGuessWithResult({
        guess: _sealWord(userResult.guesses[i].guess, permission.publicKey),
        result: userResult.guesses[i].result
      });
    }
  }

  function getSealedWord(
    Permission memory permission,
    uint32 wordIndex
  )
    public
    view
    onlySender(permission)
    returns (SealedFheedleWord memory sealedWord)
  {
    sealedWord = _sealWord(words[wordIndex], permission.publicKey);
  }
}
