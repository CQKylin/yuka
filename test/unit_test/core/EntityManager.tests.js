/**
 * @author Mugen87 / https://github.com/Mugen87
 */

const expect = require( 'chai' ).expect;
const YUKA = require( '../../../build/yuka.js' );

const EntityManager = YUKA.EntityManager;
const GameEntity = YUKA.GameEntity;
const MessageDispatcher = YUKA.MessageDispatcher;
const Telegram = YUKA.Telegram;
const Trigger = YUKA.Trigger;

describe( 'EntityManager', function () {

	describe( '#constructor()', function () {

		it( 'should create an object with correct default values', function () {

			const manager = new EntityManager();

			expect( manager ).to.have.a.property( 'entities' ).that.is.a( 'map' );
			expect( manager ).to.have.a.property( 'triggers' ).that.is.a( 'set' );
			expect( manager ).to.have.a.property( '_started' ).that.is.a( 'set' );
			expect( manager ).to.have.a.property( 'messageDispatcher' ).that.is.an.instanceof( MessageDispatcher );

		} );

	} );

	describe( '#add()', function () {

		it( 'should add a game entity to the internal map', function () {

			const manager = new EntityManager();
			const entity = new GameEntity();

			manager.add( entity );
			expect( manager.entities.has( entity.id ) ).to.be.true;

		} );

		it( 'should set the manager property of a game entity when added to the manager', function () {

			const manager = new EntityManager();
			const entity = new GameEntity();

			manager.add( entity );
			expect( entity.manager ).to.equal( manager );

		} );

	} );

	describe( '#remove()', function () {

		it( 'should remove a game entity from the internal map', function () {

			const manager = new EntityManager();
			const entity = new GameEntity();

			manager.add( entity );
			manager.remove( entity );
			expect( manager.entities.has( entity.id ) ).to.be.false;

		} );

		it( 'should set the manager property of a game entity to null when removed from the manager', function () {

			const manager = new EntityManager();
			const entity = new GameEntity();

			manager.add( entity );
			manager.remove( entity );
			expect( entity.manager ).to.be.null;

		} );

	} );

	describe( '#addTrigger()', function () {

		it( 'should add a trigger to the internal set', function () {

			const manager = new EntityManager();
			const trigger = new Trigger();

			manager.addTrigger( trigger );

			expect( manager.triggers.has( trigger ) ).to.be.true;

		} );

	} );

	describe( '#removeTrigger()', function () {

		it( 'should remove a trigger from the internal set', function () {

			const manager = new EntityManager();
			const trigger = new Trigger();

			manager.addTrigger( trigger );
			manager.removeTrigger( trigger );

			expect( manager.triggers.has( trigger ) ).to.be.false;

		} );

	} );

	describe( '#clear()', function () {

		it( 'should clear all internal data structures', function () {

			const manager = new EntityManager();
			const entity = new GameEntity();
			const telegram = new Telegram();
			const trigger = new Trigger();

			manager.entities.set( entity.id, entity );
			manager.triggers.add( trigger );
			manager._started.add( entity );
			manager.messageDispatcher.delayedTelegrams.push( telegram );

			manager.clear();

			expect( manager.entities.size ).to.equal( 0 );
			expect( manager.triggers.size ).to.equal( 0 );
			expect( manager._started.size ).to.equal( 0 );
			expect( manager.messageDispatcher.delayedTelegrams ).to.have.lengthOf( 0 );

		} );

	} );

	describe( '#getEntityById()', function () {

		it( 'should return an entity with the given ID', function () {

			const manager = new EntityManager();
			const entity = new GameEntity();

			manager.add( entity );

			expect( manager.getEntityById( entity.id ) ).to.equal( entity );

		} );

		it( 'should return undefined if there is no game entity stored for the given ID', function () {

			const manager = new EntityManager();

			expect( manager.getEntityById( 0 ) ).to.be.null;

		} );

	} );

	describe( '#getEntityByName()', function () {

		it( 'should return an entity with the given name', function () {

			const manager = new EntityManager();
			const entity = new GameEntity();
			entity.name = 'name';

			manager.add( entity );

			expect( manager.getEntityByName( entity.name ) ).to.equal( entity );

		} );

		it( 'should return null if there is no game entity stored for the given name', function () {

			const manager = new EntityManager();
			const entity = new GameEntity();
			entity.name = 'name';

			manager.add( entity );

			expect( manager.getEntityByName( '' ) ).to.be.null;

		} );

	} );

	describe( '#update()', function () {

		it( 'should call the update method of game entites and triggers', function () {

			const manager = new EntityManager();
			const delta = 1;

			const entity = new CustomEntity();
			manager.add( entity );

			const trigger = new CustomTrigger();
			manager.addTrigger( trigger );

			manager.update( delta );

			expect( entity.updated ).to.be.true;
			expect( trigger.updated ).to.be.true;

		} );

		it( 'should call the start method of game entites only once', function () {

			const manager = new EntityManager();

			const entity = new CustomEntity();
			manager.add( entity );

			manager.update();
			manager.update();
			manager.update();
			expect( entity.startCounter ).to.equal( 1 );

		} );

		it( 'should update the matrix and worldMatrix property of game entites', function () {

			const manager = new EntityManager();

			const entity1 = new GameEntity();
			entity1.position.set( 1, 1, 1 );

			const entity2 = new GameEntity();
			entity2.position.set( 0, 0, 1 );

			entity1.add( entity2 );
			manager.add( entity1 );

			manager.update();

			expect( entity1.matrix.elements ).to.deep.equal( [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1 ] );
			expect( entity1.worldMatrix.elements ).to.deep.equal( [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1 ] );
			expect( entity2.matrix.elements ).to.deep.equal( [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1 ] );
			expect( entity2.worldMatrix.elements ).to.deep.equal( [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1 ] );

		} );

	} );

	describe( '#updateNeighborhood()', function () {

		it( 'should update the neighborhood of a single game entity if necessary', function () {

			const manager = new EntityManager();

			const entity1 = new GameEntity();
			entity1.updateNeighborhood = true;
			const entity2 = new GameEntity();

			manager.add( entity1 );
			manager.add( entity2 );

			manager.updateNeighborhood( entity1 );

			expect( entity1.neighbors.has( entity2 ) ).to.be.true;
			expect( entity2.neighbors.size ).to.equal( 0 );

		} );

		it( 'should use the neighborhoodRadius of the game entity to determine the neighborhood', function () {

			const manager = new EntityManager();

			const entity1 = new GameEntity();
			entity1.updateNeighborhood = true;
			entity1.neighborhoodRadius = 2;
			const entity2 = new GameEntity();
			entity2.position.set( 0, 0, 1 );
			const entity3 = new GameEntity();
			entity3.position.set( 0, 0, 4 );

			manager.add( entity1 );
			manager.add( entity2 );
			manager.add( entity3 );

			manager.updateNeighborhood( entity1 );

			expect( entity1.neighbors.has( entity2 ) ).to.be.true;
			expect( entity1.neighbors.has( entity3 ) ).to.be.false;

		} );

	} );

	describe( '#updateEntity()', function () {

		it( 'should update a single game entity', function () {

			const manager = new EntityManager();
			const delta = 1;

			const entity = new CustomEntity();

			manager.updateEntity( entity, delta );
			expect( entity.updated ).to.be.true;

		} );

		it( 'should only update the game entity if it is active', function () {

			const manager = new EntityManager();
			const delta = 1;

			const entity = new CustomEntity();
			entity.active = false;

			manager.updateEntity( entity, delta );
			expect( entity.updated ).to.be.false;

		} );

		it( 'should update the neighborhood of a game entity if necessary', function () {

			const manager = new EntityManager();
			const delta = 1;

			const entity1 = new GameEntity();
			entity1.updateNeighborhood = true;
			const entity2 = new GameEntity();

			manager.add( entity1 );
			manager.add( entity2 );

			manager.updateEntity( entity1, delta );

			expect( entity1.neighbors.has( entity2 ) ).to.be.true;
			expect( entity2.neighbors.size ).to.equal( 0 );

		} );

		it( 'should update a single game entity and its children', function () {

			const manager = new EntityManager();
			const delta = 1;

			const entity1 = new CustomEntity();
			const entity2 = new CustomEntity();

			entity1.add( entity2 );

			manager.updateEntity( entity1, delta );
			expect( entity1.updated ).to.be.true;
			expect( entity2.updated ).to.be.true;

		} );

	} );

	describe( '#updateTrigger()', function () {

		it( 'should update a single trigger', function () {

			const manager = new EntityManager();
			const delta = 1;

			const trigger = new CustomTrigger();

			manager.updateTrigger( trigger, delta );
			expect( trigger.updated ).to.be.true;

		} );

		it( 'should only update the trigger if it is active', function () {

			const manager = new EntityManager();
			const delta = 1;

			const trigger = new CustomTrigger();
			trigger.active = false;

			manager.updateTrigger( trigger, delta );
			expect( trigger.updated ).to.be.false;

		} );

	} );

	describe( '#sendMessage()', function () {

		it( 'should send a message from a sender to a receiver entity', function () {

			const manager = new EntityManager();

			const sender = new GameEntity();
			const receiver = new CustomEntity();

			manager.sendMessage( sender, receiver, 'test', 0, {} );

			expect( receiver.messageHandled ).to.be.true;

		} );

	} );

} );

//

class CustomEntity extends GameEntity {

	constructor() {

		super();

		this.updated = false;
		this.messageHandled = false;
		this.startCounter = 0;

	}

	start() {

		this.startCounter ++;

	}

	update() {

		this.updated = true;

	}

	handleMessage() {

		this.messageHandled = true;

		return true;

	}

}

class CustomTrigger extends Trigger {

	constructor() {

		super();

		this.updated = false;

	}

	update() {

		this.updated = true;

	}

}
