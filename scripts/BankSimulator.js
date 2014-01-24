/**
 * If firebug is not available
 */
CONSOLE_ALT = {
  'warn' : function() {
    var msg = "Warning:";
    msg += "\n\n" + jQuery.makeArray(arguments).join("\n");
    alert(msg);
  },
  'error' : function() {
    var msg = "Error:";
    msg += "\n\n" + jQuery.makeArray(arguments).join("\n");
    alert(msg);
  },
  'debug' : function() {
    var msg = "Debug:";
    msg += "\n\n" + jQuery.makeArray(arguments).join("\n");
    alert(msg);
  }
};
if (typeof(console) == 'undefined') {
  console = CONSOLE_ALT;
}

/**
 * Wrapp jQuery autostart code.
 */
(function($) {
  $(document).ready(function() {
    //Generate random date for customer arrival table on load and on click
    //generateRandomTable();
    $('#generaterandom').click(generateRandomTable);
    $('#startsimulate').click(start_simulate);
  });
})(jQuery);

/**
 * Get random integer number
 */
function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate and insert random table into the textarea
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
 * Manages customerid assignments
 */
TellerManager = {
  //@internal
  'number' : 0,
  'tellerid' : 0,
  
  'getNumber' : function() {
    return this.number;
  },
  
  'getTellerId' : function() {
    return this.tellerid;
  },
  
  'increase' : function(tellerid) {
    this.tellerid = tellerid;
    return ++this.number;
  }
};

/**
 * Numbering Machine (Queue manager)
 */
NumberingMachine = {
  //@internal
  'number' : 0,
  
  'getNumber' : function() {
    return this.number;
  },
  
  'increase' : function() {
    return ++this.number;
  }
};

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
 * Constructor
 */
function Teller(id) {
  this.tellerid = id; //Should be set by caller
  this.state = TellerState.Free;
  this.customerid = TellerManager.increase(id);
  
  //@internal
  this.lastChangeTime = time();
  this.totalFreeTime = 0;
  this.totalBusyTime = 0;
  
  /**
   * Set Teller state to busy. (new customer accepted)
   */
  this.setStateBusy = function(customerid) {
    if (this.state == TellerState.Busy) {
      console.error('Teller is already busy.');
      return false;
    }
    
    //calculate total free time
    this.totalFreeTime += (time() - this.lastChangeTime);
    
    //update state and last change time
    this.lastChangeTime = time();
    this.state = TellerState.Busy;
    this.customerid = customerid;
    return true;
  };
  
  /**
   * Set teller state to free (waiting for next customer)
   */
  this.setStateFree = function() {
    if (this.state == TellerState.Free) {
      console.error('Teller is already free.');
      return false;
    }
    
    //calculate total busy time
    this.totalBusyTime += (time() - this.lastChangeTime);
    
    //update state and last change time
    this.lastChangeTime = time();
    this.state = TellerState.Free;
    this.customerid = TellerManager.increase();
    return true;
  };
  
  /**
   * Get total free time of the teller
   */
  this.getTotalFreeTime = function() {
    var curr = 0;
    if (this.state == TellerState.Free) {
      curr = time() - this.lastChangeTime;
    }
    
    return curr + this.totalFreeTime;
  };
  
  /**
   * Get total busy time of the teller
   */
  this.getTotalBusyTime = function() {
    var curr = 0;
    if (this.state == TellerState.Busy) {
      curr = time() - this.lastChangeTime;
    }
    
    return curr + this.totalBusyTime;
  };
}

/**
 * Constructor
 */
function Customer() {
  this.customerid = NumberingMachine.increase();
  this.tellerid = 0; //should be set by caller when customer gets service.
  this.state = CustomerState.WaitingForService;
  
  this.enterTime = time();
  this.inServiceTime = null;
  this.exitTime = null;
  
  /**
   * Set state to InService
   */
  this.setStateInService = function() {
    this.inServiceTime = time();
    this.state = CustomerState.InService;
  };
  
  /**
   * Set state to FinishedJob
   */
  this.setStateFinishedJob = function() {
    this.exitTime = time();
    this.state = CustomerState.FinishedJob;
  };
  
  /**
   * Get total wait time
   */ 
  this.getTotalWaitTime = function() {
    return this.inServiceTime - this.enterTime;
  };
}

/**
 * Store the state of whole system
 */
SystemState = {
  'queue' : new Queue(), //of customers
  'tellers' : new Array() //of tellers
};

/**
 * Start the simulation process
 */
function start_simulate() {
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
  var item;
  while (item = arrivaltable.pop()) {
    arrivalTableQueue.enqueue(item)
  }
  
  //store snapshots of the system state whenever a new event occurs.
  //this will produce a complete history of the system.
  var snapshots = new Array();
  
  //Initialize tellers.
  for (var tellerid = 1; tellerid <= tellerscount; tellerid++) {
    SystemState.tellers.push(new Teller(tellerid));
  }
  
  //start the simulation clock (it stores the time in minutes and increases one minute per step)
  var clock, customer;
  for (clock = 0; clock <= duraion; clock++) {
    
    //Check if customer enters
    if (arrivalTableQueue.peek() == clock) {
      //new cusomer enters.
      customer = new Customer();
      SystemState.queue.enqueue(customer);
      
      //customer has entereed. remove it from arrivale table queue.
      arrivalTableQueue.dequeue();
    }
    
    //Check for busy tellers which have finished their service and release them
    
    
    //check if customer can get service
    while (TellerManager.getNumber() == SystemState.queue.peek().customerid) {
      //customer can get service
      customer = SystemState.queue.dequeue();
      customer.tellerid = TellerManager.getTellerId();
      customer.setStateInService();
      
      SystemState.tellers[customer.tellerid - 1].setStateBusy();
    }
    
    // now take a snapshot of system
    //mabe this shold be done on every change.
  }
}
