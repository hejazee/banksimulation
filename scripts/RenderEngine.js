RenderingEngine = {
  /**
   * Does the rendering action.
   * Use getRenderedOutput() to get render output.
   */
  'render' : function(log) {
    //LOG.warn(print_r(log, true));
    //LOG.warn(print_r(log[0][0], true));
    //log.forEach(function(item1) {
    //  item1.forEach(function(item2) {
    //    LOG.warn(print_r(item2['message'], true));
    //  })
    //});
    var c1, c2;
    for (c1 in log) {
      for (c2 in log[c1]) {
        var item = log[c1][c2];
        var message = item['message'];
        var type = item['type'];
        var clock = item['clock'];

        var prevClock, clockChanged;

        //check if clock changed
        if (prevClock != clock) {
          clockChanged = true;
          prevClock = clock;
        }
        else {
          clockChanged = false;
        }

        //If clock changed, insert a row for this.
        if (clockChanged) {
          RenderingEngine.appendItem("CLOCK: " + clock, "clock_changed");
        }

        switch (type) {
          case SystemStateLogTypes.Customer.Enter:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.Customer.GetService:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.Customer.Exit:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.TellerManager.CreateTeller:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.TellerManager.Increase:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.TellerManager.ListFreeTellers:
            //message is a rendered array
            RenderingEngine.appendItem("<p>Free tellers list</p>" + message, type);
            break;
            break;
          case SystemStateLogTypes.Teller.StateBusy:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.Teller.StateFree:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.Queue.Log:
            //message is a rendered Queue object
            RenderingEngine.appendItem("<p>Customer Queue</p>" + message, type);
            break;
          case SystemStateLogTypes.NumberingMachine.Increase:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.SimulationEngine.Start:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.SimulationEngine.Finish:
            RenderingEngine.appendItem(message, type);
            break;
          case SystemStateLogTypes.SimulationEngine.Log:
            RenderingEngine.appendItem(message, type);
            break;
          default:
            LOG.error('invalid SystemStateLogTypes passed to rendering engine: ' + type);
            break;
        }
      }
    }
  },

  /**
   * Holds temporary output
   */
  'renderedItems' : '',

  /**
   * Append new item to temporary output
   */
  'appendItem' : function(item, htmlclass) {
    this.renderedItems += "\n" + '<li class="' + htmlclass + '">' + item + '</li>' + "\n";
  },

  /**
   * Wrap the temporary output and produce final result.
   */
  'getRenderedOutput' : function() {
    return '<ul>' + this.renderedItems + '</ul>'
  },

  /**
   * Render a single Queue() object
   */
  'renderQueue' : function(queue) {
    var result = '';

    //check if queue is empty
    if (!queue.isEmpty()) {
      result = '<ol>';
      var queue_all = queue.getAll();
      for (var i = 0; i <= queue_all.length - 1; i++) {
        var customer = queue_all[i];
        var customerid = customer.customerid;
        //var tellerid = customer.tellerid;
        //var state = customer.state;
        var enterTime = customer.enterTime;
        //var inServiceTime = customer.inServiceTime;
        //var exitTime = customer.exitTime;

        result += '<li>';
          result += '<ul class="inline-ul">';
            result += '<li>';
              result += '<span class="label">ID</span>';
              result += '<span class="value">' + customerid + '</span>';
            result += '</li>';
            result += '<li>';
              result += '<span class="label">Enter time</span>';
              result += '<span class="value">' + enterTime + '</span>';
            result += '</li>';
          result += '</ul>';
        result += '</li>';
      }

      result += '</ol>';
    }
    else {
      result += '<p>Customer queue is empty</p>';
    }

    return result;
  },

  'renderTellerArray' : function(tellerArr) {
    var result = '';

    //check if queue is empty
    if (tellerArr.length > 0) {
      result = '<ul>';
      for (var i = 0; i <= tellerArr.length - 1; i++) {
        var teller = tellerArr[i];
        var tellerid = teller.tellerid;
        var customerid = teller.customerid;

        result += '<li>';
          result += '<ul class="inline-ul">';
            result += '<li>';
              result += '<span class="label">ID</span>';
              result += '<span class="value">' + tellerid + '</span>';
            result += '</li>';
            result += '<li>';
              result += '<span class="label">Customer Number</span>';
              result += '<span class="value">' + customerid + '</span>';
            result += '</li>';
          result += '</ul>';
        result += '</li>';
      }

      result += '</ul>';
    }
    else {
      result += '<p>Teller array is empty</p>';
    }

    return result;
  }
};
