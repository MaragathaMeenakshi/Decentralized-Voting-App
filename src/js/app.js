App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },


  initContract: function() {
    $.getJSON("Election.json", function(election) {
      console.log("Election contract JSON loaded:", election);
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    }).fail(function(jqxhr, textStatus, error) {
      console.error("Error loading contract JSON:", error);
    });
  },

  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("Event triggered", event);
        App.render();
      });
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
  
    loader.show();
    content.hide();
  
    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });
  
    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      var candidatesSelect = $("#candidatesSelect"); // Ensure you have a select element with id candidatesSelect
      candidatesResults.empty();
      candidatesSelect.empty();
  
      var candidatePromises = [];
      for (var i = 1; i <= candidatesCount; i++) {
        candidatePromises.push(electionInstance.candidates(i));
      }
  
      return Promise.all(candidatePromises);
    }).then(function(candidates) {
      var candidatesResults = $("#candidatesResults");
      var candidatesSelect = $("#candidatesSelect");
  
      candidates.forEach(function(candidate) {
        var id = candidate[0].toNumber();
        var name = candidate[1];
        var voteCount = candidate[2].toNumber();
  
        // Render candidate Result
        var candidateTemplate = `<tr><th>${id}</th><td>${name}</td><td>${voteCount}</td></tr>`;
        candidatesResults.append(candidateTemplate);
  
        // Render candidate ballot option
        var candidateOption = `<option value='${id}'>${name}</option>`;
        candidatesSelect.append(candidateOption);
      });
  
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if (hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
      loader.hide();
      content.show();
    });
  }
  
}

$(function() {
  $(window).load(function() {
    App.init();
  });
});