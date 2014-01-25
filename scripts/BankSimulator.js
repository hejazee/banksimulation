/**
 * Wrap jQuery auto start code.
 */
(function($) {
  $(document).ready(function() {
    //Generate random date for customer arrival table on load and on click
    //generateRandomTable();
    $('#generaterandom').click(generateRandomTable);
    $('#startsimulate').click(function() {
      if (SIMULATION_STARTED) {
        if (confirm("This will reload the page to prepare a fresh state.\n" +
            "You should click this button again after reload. \n" +
            "Are you sure?")) {
          location.reload();
        }
      }
      else {
        start_simulate();
      }
    });
  });
})(jQuery);

/**
 * Logging system types
 */
LOGTYPES = {
  'disabled' : 0,
  'console' : 1,
  'alert' : 2
};

//set log type to console for debugging.
logtype = LOGTYPES.console;

/**
 * Logging system object
 */
LOG = {
  'warn' : function() {
    var msg = jQuery.makeArray(arguments).join("\n");
    switch (logtype) {
      case LOGTYPES.alert:
        msg = "Warning:\n\n" + msg;
        alert(msg);
        break;
      case LOGTYPES.console:
        console.warn(msg);
        break;
    }
  },
  'error' : function() {
    var msg = jQuery.makeArray(arguments).join("\n");
    switch (logtype) {
      case LOGTYPES.alert:
        msg = "Error:\n\n" + msg;
        alert(msg);
        break;
      case LOGTYPES.console:
        console.error(msg);
        break;
    }
  },
  'debug' : function() {
    var msg = jQuery.makeArray(arguments).join("\n");
    switch (logtype) {
      case LOGTYPES.alert:
        msg = "Debug:\n\n" + msg;
        alert(msg);
        break;
      case LOGTYPES.console:
        console.debug(msg);
        break;
    }
  },
  'log' : function() {
    var msg = jQuery.makeArray(arguments).join("\n");
    switch (logtype) {
      case LOGTYPES.alert:
        msg = "Log:\n\n" + msg;
        alert(msg);
        break;
      case LOGTYPES.console:
        console.log(msg);
        break;
    }
  }
};

/**
 * Global CLOCK (for time tracking)
 * stores simulated time in minutes
 */
CLOCK = 0;

/**
 * Indicates whether simulation has been started.
 */
SIMULATION_STARTED = false;

/**
 * Holds all customers that have been created (entered the bank).
 */
AllCustomers = [];

/**
 * Enum TellerState
 */
TellerState = {
  'Free' : 0,
  'Busy' : 1
};

/**
 * Enum CustomerState
 */
CustomerState = {
  'WaitingForService' : 0,
  'InService' : 1,
  'FinishedJob' : 2
};

/**
 * Enum: System State Logging service.
 */
SystemStateLog = [];
SystemStateLogTypes = {
  'Customer' : {
    'Enter' : 'customer_enter', //new customer enters.
    'GetService' : 'customer_getservice', //customer gets service.
    'Exit' : 'customer_exit' //customer's job is finished.
  },
  'TellerManager' : {
    'CreateTeller' : 'tellermanagaer_create_teller', //new teller created by system.
    'Increase' : 'tellermanager_increase' //Speaker Calls new customer.
  },
  'Teller' : {
    'StateBusy' : 'teller_state_busy', //Teller becomes busy.
    'StateFree' : 'teller_state_free' //Teller becomes free.
  },
  'Queue' : {
    'Log' : 'queue_log' //just logging customer queue state.
  },
  'NumberingMachine' : {
    'Increase' : 'numberingmachine_increase' //customer gets new number from numbering machine.
  },
  'SimulationEngine' : {
    'Start' : 'simulation_start', //simulation started.
    'Finish' : 'simulation_finish', //simulation finished.
    'Log' : 'simulation_log' //a new log entry. this is related to previous log entry and provides additional data.
  }
};

/**
 * Log a new system state message.
 * this log will later be rendered for display.
 */
function SystemState_log(type, msg) {
  if (typeof(SystemStateLog[CLOCK]) == 'undefined') {
    SystemStateLog[CLOCK] = [];
  }
  SystemStateLog[CLOCK][SystemStateLog[CLOCK].length] = {
    'message' : msg,
    'type' : type
  };
}

/**
 * Get random integer number
 */
function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate and insert random table into the text area
 */
function generateRandomTable() {
  var table_str = '',
  prev_time = 0,
  samp_time = 0, //temp
  duration = $('#duration').val(),
  customer_count = getRandomInt(Math.floor(duration / 3), duration),
  max_time;
  
  for (var i = 1; i <= customer_count; i++) {
    //we want to generate a random time. it should be in the selected time span.
    //it should be near the previous number.
    max_time = prev_time + 5;
    if (max_time > duration) {
      max_time = duration;
    }
    
    samp_time = getRandomInt(prev_time, max_time);
    
    if (prev_time == samp_time) {
      continue;
    }
    
    table_str += "\n" + samp_time;
    
    if (samp_time == duration) {
      break;
    }
    
    prev_time = samp_time;
  }
  
  $('#arrivaltable').val(table_str.trim());
}

/**
 * Manages Tellers
 */
TellerManager = {
  //@internal
  'tellers' : [],
  'lastnumber' : 0,

  /**
   * Create a new Teller and assign a teller id
   * and push it into the this.tellers array
   */
  'createTeller' : function() {
    LOG.debug('called TellerManager.createTeller()');
    var teller = new Teller(this.tellers.length + 1);
    this.tellers.push(teller);

    //Log create teller
    SystemState_log(SystemStateLogTypes.TellerManager.CreateTeller, "Teller created");
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Teller id: " + teller.tellerid);
  },

  /**
   * Get a teller object by its id
   */
  'getTeller' : function(tellerid) {
    LOG.debug('called TellerManager.getTeller(' + tellerid + ')');
    if (typeof(this.tellers[tellerid - 1]) != 'undefined') {
      return this.tellers[tellerid - 1];
    }
    else {
      return false;
    }
  },

  /**
   * Get array of all free tellers.
   */
  'getFreeTellers' : function() {
    LOG.debug('called TellerManager.getFreeTellers()');
    var result = [];
    //for (var teller1 in this.tellers) {
    //  if (teller1.state == TellerState.Free) {
    //    result.push(teller1);
    //  }
    //}
    this.tellers.forEach(function(teller1) {
      if (teller1.state == TellerState.Free) {
        result.push(teller1);
      }
    });

    return result;
  },

  /**
   * get an array of customer numbers than gat get service.
   */
  'getWaitingNumbers' : function() {
    LOG.debug('called TellerManager.getWaitingNumbers()');
    var result = [];
    this.tellers.forEach(function(teller1) {
      if (teller1.state == TellerState.Free) {
        result.push(teller1.customerid);
      }
    });
    return result;
  },

  /**
   * Check if a given customer id can get service now
   */
  'searchForWaitingCustomer' : function(customerid) {
    LOG.debug('called TellerManager.searchForWaitingCustomer(' + customerid + ')');
    var waitingNumbers = this.getWaitingNumbers();
    return (waitingNumbers.indexOf(customerid) >= 0);
  },

  'increaseNumber' : function() {
    LOG.debug('called TellerManager.increaseNumber()');

    //Log create teller
    SystemState_log(SystemStateLogTypes.TellerManager.Increase, "Speaker calls new customer.");
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "New number: " + this.lastnumber + 1);

    return ++this.lastnumber;
  }
};

/**
 * Numbering Machine (Queue manager)
 */
NumberingMachine = {
  //@internal
  'number' : 0,
  
  'getNumber' : function() {
    LOG.debug('called NumberingMachine.getNumber()');
    return this.number;
  },
  
  'increase' : function() {
    LOG.debug('called NumberingMachine.increase()');
    return ++this.number;
  }
};

/**
 * Constructor
 */
function Teller(id) {
  LOG.debug('called new Teller(' + id + ')');
  this.tellerid = id; //Should be set by caller

  //Set number to a new customer, and set state to Free
  //This simulates a new customer call.
  this.state = TellerState.Free;
  this.customerid = TellerManager.increaseNumber();
  
  //@internal
  this.lastChangeTime = CLOCK;
  this.totalFreeTime = 0;
  this.totalBusyTime = 0;
  
  /**
   * Set Teller state to busy. (new customer accepted)
   */
  this.setStateBusy = function(customerid) {
    if (this.state == TellerState.Busy) {
      LOG.error('Teller is already busy.');
      return false;
    }
    
    //calculate total free time
    this.totalFreeTime += (CLOCK - this.lastChangeTime);
    
    //update state and last change time
    this.lastChangeTime = CLOCK;
    this.state = TellerState.Busy;
    this.customerid = customerid;

    //Log Tellers becomes busy
    SystemState_log(SystemStateLogTypes.Teller.StateBusy, "Teller becomes busy.");
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Teller id: " + this.tellerid);
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Accepted customer id: " + customerid);
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Total free time is: " +
        this.getTotalFreeTime() + ' minutes.');
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Total busy time is: " +
        this.getTotalBusyTime() + ' minutes.');

    return true;
  };
  
  /**
   * Set teller state to free (waiting for next customer)
   */
  this.setStateFree = function() {
    if (this.state == TellerState.Free) {
      LOG.error('Teller is already free.');
      return false;
    }
    
    //calculate total busy time
    this.totalBusyTime += (CLOCK - this.lastChangeTime);
    
    //update state and last change time
    this.lastChangeTime = CLOCK;
    this.state = TellerState.Free;
    this.customerid = TellerManager.increaseNumber();

    //Log Tellers becomes free
    SystemState_log(SystemStateLogTypes.Teller.StateFree, "Teller becomes free.");
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Teller id: " + this.tellerid);
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Now can accept customer id: " +
        this.customerid);
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Total free time is: " +
        this.getTotalFreeTime() + ' minutes.');
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Total busy time is: " +
        this.getTotalBusyTime() + ' minutes.');

    return true;
  };
  
  /**
   * Get total free time of the teller
   */
  this.getTotalFreeTime = function() {
    var curr = 0;
    if (this.state == TellerState.Free) {
      curr = CLOCK - this.lastChangeTime;
    }
    
    return curr + this.totalFreeTime;
  };
  
  /**
   * Get total busy time of the teller
   */
  this.getTotalBusyTime = function() {
    var curr = 0;
    if (this.state == TellerState.Busy) {
      curr = CLOCK - this.lastChangeTime;
    }
    
    return curr + this.totalBusyTime;
  };
}

/**
 * Constructor
 */
function Customer() {
  this.customerid = NumberingMachine.increase();

  //Save this customer to AllCustomers for later reference.
  AllCustomers[this.customerid] = this;

  this.tellerid = 0; //should be set by caller when customer gets service.
  this.state = CustomerState.WaitingForService;
  
  this.enterTime = CLOCK;
  this.inServiceTime = null;
  this.exitTime = null;
  
  /**
   * Set state to InService
   */
  this.setStateInService = function() {
    this.inServiceTime = CLOCK;
    this.state = CustomerState.InService;

    //Log customer gets service
    SystemState_log(SystemStateLogTypes.Customer.GetService, "Customer gets service");
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Customer id: " + this.customerid);
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Customer total wait time: " +
        this.getTotalWaitTime());
  };
  
  /**
   * Set state to FinishedJob
   */
  this.setStateFinishedJob = function() {
    this.exitTime = CLOCK;
    this.state = CustomerState.FinishedJob;

    //Log customer leaves the bank
    SystemState_log(SystemStateLogTypes.Customer.Exit, "Customer leaves the bank.");
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Customer id: " + this.customerid);
    SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Customer leaved the bank after: " +
        (this.exitTime - this.enterTime) + ' minutes.');
  };
  
  /**
   * Get total wait time
   */ 
  this.getTotalWaitTime = function() {
    return this.inServiceTime - this.enterTime;
  };

  //Log Customer enters the bank
  SystemState_log(SystemStateLogTypes.Customer.Enter, "New customer entered bank");
  SystemState_log(SystemStateLogTypes.SimulationEngine.Log, "Customer id: " + this.customerid);
  //Log Queue
  SystemState_log(SystemStateLogTypes.Queue.Log, CustomerQueue);
}

/**
 * Global customer queue
 */
CustomerQueue = new Queue();

/**
 * Start the simulation process
 */
function start_simulate() {
  SIMULATION_STARTED = true;
  SystemState_log(SystemStateLogTypes.SimulationEngine.Start, 'Simulation started');

  //Initialize variables
  var duration = Number($('#duration').val())
  , arrivaltable = $('#arrivaltable').val()
  , responsetimeave = Number($('#responsetimeave').val())
  , tellerscount = Number($('#tellerscount').val())
  ;
  
  arrivaltable = str_replace("\r", "\n", arrivaltable);
  arrivaltable = str_replace("\n\n", "\n", arrivaltable);
  arrivaltable = explode("\n", arrivaltable);
  
  //convert arrival table into a queue
  var arrivalTableQueue = new Queue();
  for (var i = 0; i < arrivaltable.length; i++) {
    arrivalTableQueue.enqueue(arrivaltable[i]);
  }
  
  //Initialize tellers.
  for (var tellerid = 1; tellerid <= tellerscount; tellerid++) {
    TellerManager.createTeller();
  }
  
  //start the simulation CLOCK (it stores the time in minutes and increases one minute per step)
  var customer;
  for (CLOCK = 0; CLOCK <= duration; CLOCK++) {
    
    //Check if customer enters
    var new_arrival = arrivalTableQueue.peek();
    if (new_arrival == CLOCK) {
      //new customer enters.
      customer = new Customer();
      CustomerQueue.enqueue(customer);
      
      //customer has entered. remove it from arrival table queue.
      arrivalTableQueue.dequeue();
    }

    //Check for finished jobs
    TellerManager.tellers.forEach(function(teller1) {
      if (teller1.state == TellerState.Busy) {
        //check for critical error
        if (typeof(AllCustomers[teller1.customerid]) == 'undefined') {
          LOG.error('Critical: customer is not defined in AllCustomers. customerid=' +
              teller1.customerid + ', tellerid=' + teller1.tellerid);
          return;
        }

        var customer1 = AllCustomers[teller1.customerid];
        var customer1_inservice_time = CLOCK - customer1.inServiceTime;
        if (customer1_inservice_time == responsetimeave) {
          //customer's job has been finished. clear resources.
          customer1.setStateFinishedJob();
          teller1.setStateFree();
        }
        else if (customer1_inservice_time > responsetimeave) {
          //Normally This should not happen.
          LOG.error("customer inservice wait time is greater than average response time" +
              'customer1_inservice_time=' + customer1_inservice_time);
        }
      }
    });

    //check for customers that can get service
    while (true) {
      var last_customer = CustomerQueue.peek();
      if (typeof(last_customer) == 'undefined') {
        break;
      }
      var last_customer_can_get_service = TellerManager.searchForWaitingCustomer(last_customer.customerid);
      if (last_customer_can_get_service) {
        //customer can get service
        customer = CustomerQueue.dequeue();
        customer.tellerid = TellerManager.getFreeTellers()[0].tellerid;
        customer.setStateInService();

        var theTeller = TellerManager.getTeller(customer.tellerid);
        theTeller.setStateBusy(customer.customerid);
      }
      else {
        break;
      }
    }
  }

  SystemState_log(SystemStateLogTypes.SimulationEngine.Finish, 'Simulation finished.');
  RenderingEngine.render(SystemStateLog);
}
