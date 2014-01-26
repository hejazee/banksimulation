function Queue(){
  this.queue  = [];

  /**
   * Return the length of the queue.
   */
  this.getLength = function(){
    return (this.queue.length);
  };

  /**
   * Return true if the queue is empty, and false otherwise.
   */
  this.isEmpty = function(){
    return (this.queue.length == 0);
  };

  /**
   * Enqueue the specified item. The parameter is:
   *
   * item - the item to enqueue
   */
  this.enqueue = function(item){
    this.queue.push(item);
  };

  /**
   * Dequeue an item and returns it. If the queue is empty then undefined is
   * returned.
   */
  this.dequeue = function(){
    // if the queue is empty, return undefined
    if (this.queue.length == 0) return undefined;

    // store the item at the front of the queue
    var item = this.queue[0];

    var new_arr = [];
    for (var i = 1; i < this.queue.length; i++) {
      new_arr.push(this.queue[i]);
    }
    this.queue = new_arr;

    return item;
  };

  /* Returns the item at the front of the queue (without dequeuing it). If the
   * queue is empty then undefined is returned.
   */
  this.peek = function(){
    // return the item at the front of the queue
    return (this.queue.length > 0 ? this.queue[0] : undefined);
  };

  /**
   * Get all items of the queue
   */
  this.getAll = function() {
    return this.queue;
  };
}
