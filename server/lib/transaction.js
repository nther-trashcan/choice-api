function Transaction(Model) {
    this.Model = Model;
    this.isInTransation = false;
  }
  
  Transaction.prototype.start = function() {
    let self = this;
    let connector = self.Model.getDataSource().connector;
    if (connector.name !== 'mongodb') {
      throw new tools.createError(500, 'Only support mongodb database transaction');
    }
    else {
      if (!self.isInTransation) {
        self.session = connector.client.startSession();
        self.session.startTransaction();
        self.isInTransation = true;
      }
    }
  };
  
  Transaction.prototype.commit = async function() {
    let self = this;
    if (self.isInTransation) {
      await self.session.commitTransaction();
      self.session.endSession();
      self.isInTransation = false;
    }
  };
  
  Transaction.prototype.rollback = async function() {
    let self = this;
    if (self.isInTransation) {
      await self.session.abortTransaction();
      self.session.endSession();
      self.isInTransation = false;
    }
  };
  
  module.exports = Transaction;