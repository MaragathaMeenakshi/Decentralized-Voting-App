const Election = artifacts.require("Election");

contract("Election", function(accounts) {
  let electionInstance;

  before(async function() {
    electionInstance = await Election.deployed();
  });

  it("allows a voter to cast a vote", async function() {
    const candidateId = 1;
    await electionInstance.vote(candidateId, { from: accounts[0] });
    const voted = await electionInstance.voters(accounts[0]);
    assert(voted, "the voter was marked as voted");
    const candidate = await electionInstance.candidates(candidateId);
    const voteCount = candidate[2].toNumber(); // Convert BigNumber to number
    assert.equal(voteCount, 1, "increments the candidate's vote count");
  });

  it("throws an exception for invalid candidates", async function() {
    try {
      await electionInstance.vote(99, { from: accounts[1] });
      assert.fail("Expected transaction to revert");
    } catch (error) {
      assert(error.message.includes("Invalid candidate"), "Expected error message to contain 'Invalid candidate'");
    }
  });

  it("throws an exception for double voting", async function() {
    try {
      const candidateId = 2;
      await electionInstance.vote(candidateId, { from: accounts[1] });
      // Try to vote again
      await electionInstance.vote(candidateId, { from: accounts[1] });
      assert.fail("Expected transaction to revert");
    } catch (error) {
      assert(error.message.includes("You have already voted"), "Expected error message to contain 'You have already voted'");
    }
  });

  it("allows a voter to cast a vote", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      candidateId = 1;
      return electionInstance.vote(candidateId, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
      assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
      return electionInstance.voters(accounts[0]);
    }).then(function(voted) {
      assert(voted, "the voter was marked as voted");
      return electionInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate.voteCount;
      assert.equal(voteCount, 1, "increments the candidate's vote count");
    });
  });

});
