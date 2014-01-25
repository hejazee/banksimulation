RenderingEngine = {
  'render' : function(log) {
    //LOG.warn(print_r(log, true));
    //LOG.warn(print_r(log[0][0], true));
    log.forEach(function(item1) {
      item1.forEach(function(item2) {
        LOG.warn(print_r(item2['message'], true));
      })
    });
    /*
    switch (type) {
      case SystemStateLogTypes.Customer.Enter:

        break;
      case SystemStateLogTypes.Customer.GetService:

        break;
      case SystemStateLogTypes.Customer.Exit:

        break;
      case SystemStateLogTypes.TellerManager.CreateTeller:

        break;
      case SystemStateLogTypes.TellerManager.Increase:

        break;
      case SystemStateLogTypes.Teller.StateBusy:

        break;
      case SystemStateLogTypes.Teller.StateFree:

        break;
      case SystemStateLogTypes.Queue.Log:
        //argument is a Queue object
        break;
      case SystemStateLogTypes.NumberingMachine.Increase:

        break;
      case SystemStateLogTypes.SimulationEngine.Start:

        break;
      case SystemStateLogTypes.SimulationEngine.Finish:

        break;
      default:

        break;
    }
    */
  }
};
