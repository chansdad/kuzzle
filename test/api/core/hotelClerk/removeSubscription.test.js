const
  should = require('should'),
  sinon = require('sinon'),
  sandbox = sinon.sandbox.create(),
  Request = require('kuzzle-common-objects').Request,
  NotFoundError = require('kuzzle-common-objects').errors.NotFoundError,
  Dsl = require('../../../../lib/api/dsl'),
  HotelClerk = require('../../../../lib/api/core/hotelClerk'),
  KuzzleMock = require('../../../mocks/kuzzle.mock');

describe('Test: hotelClerk.removeSubscription', () => {
  let
    kuzzle,
    connectionId = 'connectionid',
    context = {
      connectionId,
      user: null
    },
    index = 'test',
    collection = 'user',
    unsubscribeRequest;


  beforeEach(() => {
    kuzzle = new KuzzleMock();
    kuzzle.hotelClerk = new HotelClerk(kuzzle);
    kuzzle.dsl = new Dsl();

    unsubscribeRequest = new Request({
      controller: 'realtime',
      action: 'unsubscribe',
      index: index,
      collection: collection,
      body: { roomId: 'foo' }
    }, context);

    kuzzle.hotelClerk.customers[connectionId] = {
      'foo': {},
      'bar': {}
    };

    kuzzle.hotelClerk.rooms = {
      'foo': {
        customers: new Set([connectionId]),
        index,
        collection,
        channels: ['foobar']
      },
      'bar': {
        customers: new Set([connectionId]),
        index,
        collection,
        channels: ['barfoo']
      }
    };

  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should do nothing if a bad room name is given', () => {
    unsubscribeRequest.input.body.roomId = 'qux';
    return should(() => kuzzle.hotelClerk.removeSubscription(unsubscribeRequest))
      .throw(NotFoundError);
  });

  it('should not delete all subscriptions when we want to just remove one', () => {
    kuzzle.dsl.remove = sinon.stub();
    const response = kuzzle.hotelClerk.removeSubscription(unsubscribeRequest, context);
    should(response)
      .be.exactly(unsubscribeRequest.input.body.roomId);

    should(kuzzle.dsl.remove)
      .be.calledOnce();

    should(kuzzle.notifier.notify.called).be.false();

    should(kuzzle.hotelClerk.rooms).be.an.Object();
    should(kuzzle.hotelClerk.rooms).have.property('bar');
    should(kuzzle.hotelClerk.rooms).not.have.property('foo');

    should(kuzzle.hotelClerk.customers).be.an.Object();
    should(kuzzle.hotelClerk.customers).not.be.empty();
  });

  it('should clean up customers, rooms object', () => {
    kuzzle.dsl.remove = sinon.stub();

    delete kuzzle.hotelClerk.rooms.bar;
    delete kuzzle.hotelClerk.customers[connectionId].bar;

    const response = kuzzle.hotelClerk.removeSubscription(unsubscribeRequest, context);
    should(response)
      .be.exactly(unsubscribeRequest.input.body.roomId);

    should(kuzzle.dsl.remove)
      .be.calledOnce()
      .be.calledWith(unsubscribeRequest.input.body.roomId);

    should(kuzzle.notifier.notify.called).be.false();

    should(kuzzle.hotelClerk.rooms).be.an.Object();
    should(kuzzle.hotelClerk.rooms).be.empty();

    should(kuzzle.hotelClerk.customers).be.an.Object();
    should(kuzzle.hotelClerk.customers).be.empty();
  });

  it('should send a notification to other users connected on that room', () => {
    kuzzle.dsl.remove = sinon.spy();

    kuzzle.hotelClerk.rooms.foo.customers.add('another connection');
    kuzzle.hotelClerk.removeSubscription(unsubscribeRequest, context);

    should(kuzzle.dsl.remove)
      .have.callCount(0);

    should(kuzzle.notifier.notify)
      .be.calledOnce();

    // testing roomId argument
    should(kuzzle.notifier.notify.args[0][0]).match(['foo']);

    // testing requestObject argument
    should(kuzzle.notifier.notify.args[0][1]).be.instanceOf(Request);
    should(kuzzle.notifier.notify.args[0][1].input.controller).be.exactly('realtime');
    should(kuzzle.notifier.notify.args[0][1].input.action).be.exactly('unsubscribe');
    should(kuzzle.notifier.notify.args[0][1].input.resource.index).be.exactly(index);

    // testing payload argument
    should(kuzzle.notifier.notify.args[0][2].count).be.exactly(1);
  });

  it('should trigger a proxy:leaveChannel hook', function () {
    kuzzle.dsl.remove = sinon.stub();

    kuzzle.hotelClerk.removeSubscription(unsubscribeRequest, context);

    should(kuzzle.pluginsManager.trigger)
      .be.calledWith('proxy:leaveChannel');

    const data = kuzzle.pluginsManager.trigger.secondCall.args[1];

    should(data).be.an.Object();
    should(data.channel).be.a.String();
    should(data.connectionId).be.eql(context.connectionId);
  });

});
