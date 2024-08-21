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

struct FheedleWord {
  euint8 l0;
  euint8 l1;
  euint8 l2;
  euint8 l3;
  euint8 l4;
}
struct FheedleWordResult {
  uint8 r0;
  uint8 r1;
  uint8 r2;
  uint8 r3;
  uint8 r4;
}
struct FheedleGuessWithResult {
  FheedleWord guess;
  FheedleWordResult result;
}

struct FheedleGameResult {
  FheedleGuessWithResult[] guesses;
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

  function addWord(
    FheedleWord calldata word
  ) public returns (uint32 wordIndex) {
    uint32 wordIndex = numberOfWords;

    words[wordIndex] = word;

    numberOfWords += 1;
  }

  function makeGuess(
    uint32 wordIndex,
    FheedleWord guess
  ) public returns (FheedleWordResult memory wordResult, bool correct) {
    FheedleGameResult storage userResult = userResults[msg.sender][wordIndex];

    if (userResult.gotItIn != 0) revert AlreadyGuessedCorrectly();

    uint8 userGuessCount = userResult.guesses.length;
    if (userGuessCount == 6) revert OutOfGuesses();

    (wordResult, correct) = checkGuess(wordIndex, guess);

    if (correct) {
      userResult.gotItIn = userResult.guesses.length;
    }
  }

  function add(inEuint32 calldata encryptedValue) public {
    euint32 value = FHE.asEuint32(encryptedValue);
    counter = counter + value;
  }

  function getCounter() public view returns (uint256) {
    return FHE.decrypt(counter);
  }

  function getCounterPermit(
    Permission memory permission
  ) public view onlySender(permission) returns (uint256) {
    return FHE.decrypt(counter);
  }

  function getCounterPermitSealed(
    Permission memory permission
  ) public view onlySender(permission) returns (string memory) {
    return FHE.sealoutput(counter, permission.publicKey);
  }
}
