(function(window, document, undefined) {
'use strict';

var MODES = {
    TRUMP: 'Trump',
    DEAL: 'Deal',
    ESTIMATE: 'Estimate',
    GIVER: 'Giver',
    PLAY: 'Play'
};

var PLAYERS = [
    ['top', 'Oben'],
    ['left', 'Links'],
    ['bottom', 'Unten (Spieler)'],
    ['right', 'Rechts']
];

var ROUNDS = 9;
var MAX_POINTS = 157;
var LAST_TRICK_POINTS = 5;

var gameNode = document.getElementById('game');
var node = function (name, opts, className) {
    var n = document.createElement(name);
    if (typeof opts === 'object') {
        for (var attr in opts) {
            if (opts.hasOwnProperty(attr)) {
                n[attr] = opts[attr];
            }
        }
    } else {
        if (opts) { n.innerHTML = opts; }
        if (className) { n.className = className; }
    }
    return n;
};
var p = node.bind(this, 'p');
var badge = function (text) {
    return node('span', text, 'card-badge');
};
Array.prototype.sum = function (getter, initial) {
    if (!initial) {
        initial = 0;
    }
    if (!getter) {
        getter = function (x) { return x; }
    }
    return this.reduce(function (p, c) {
        return p + getter(c);
    }, initial);
};
Math.randInt = function (min, max) {
    if (!max) {
        max = min;
        min = 0;
    }
    return Math.floor(Math.floor(Math.random() * (max - min)) + min);
};


/**
 * card counter app
 */
var App = function() {
    this.reset();
};
App.prototype.reset = function() {
    this.mode = MODES.TRUMP;
    this.state = {
        trump: null,
        hand: [],
        played: [],
        tricks: [],
        estimate: null,
        points: 0,
        round: 1,
        giver: null
    };
};
/**
 * Fake the current game's state.
 */
App.prototype.fake = function (mode, rounds) {
    if (mode === MODES.TRUMP) {
        this.mode = mode;
        return;
    }
    // Fake trump color
    this.setTrump(Math.randInt(COLORS.length));

    if (mode === MODES.DEAL) {
        this.mode = mode;
        return;
    }

    // fake hand dealt cards
    var cards, hand = [];
    for (var i = 0; i < ROUNDS; i += 1) {
        cards = CARDS.filter(function (card) {
            return hand.indexOf(card) === -1;
        });
        hand.push(cards[Math.randInt(cards.length)]);
        console.debug('[fake] dealt card ' + hand[hand.length - 1].toString());
    }
    this.state.hand = hand;

    if (mode === MODES.ESTIMATE) {
        this.mode = mode;
        return;
    }

    // fake estimate
    var i, total, points = [];
    for (i = 0; i < ROUNDS; i += 1) {
        points[i] = this.state.hand[i].getPoints(this.state.trump);
        if (this.state.trump === this.state.hand[i].color) {
            points[i] *= 2;
        }
    }

    total = points.sum();
    this.verifyEstimate(null, Math.randInt(
        Math.max(0, total - total * 0.1), Math.min(MAX_POINTS, total + total * 0.4)));
    console.debug('[fake] points in hand %d, guesstimate: %d', total, this.state.estimate);

    if (mode === MODES.GIVER) {
        return;
    }

    this.setGiver(Math.randInt(0, PLAYERS.length));
    console.debug('[fake] giver set to ' + this.state.giver);
    this.mode = mode;
};

/**
 * Creates a list of all cards
 */
App.prototype.getCardList = function(cards, callback, dontBreak) {
    var list, i, card, previousColor = 0;
    list = node('div');
    for (i = 0; i < cards.length; i += 1) {
        card = cards[i].getNode(this.state.trump);
        this.annotateCard(cards[i], card);
        if (callback) {
            card.onclick = callback.bind(this, cards[i]);
        }
        if (!dontBreak && cards[i].color !== previousColor) {
            list.appendChild(node('br'));
            previousColor = cards[i].color;
        }
        list.appendChild(card);
    }
    return list;
};
App.prototype.getCardListNoHand = function(callback) {
    var hand = this.state.hand;
    return this.getCardList(CARDS.filter(function (card) {
        return hand.indexOf(card) === -1;
    }), callback);
};
App.prototype.getCardListHand = function(callback) {
    var hand = this.state.hand,
        played = this.state.played;

    return this.getCardList(CARDS.filter(function (card) {
        return hand.indexOf(card) !== -1 && played.indexOf(card) === -1;
    }), callback, true);
};

/**
 * Annotate cards with useful badges
 * - card value
 * - highest card in play of a color ("bock")
 */
App.prototype.annotateCard = function(card, node) {
    if (card.color === this.state.trump) {
        if (card.value === VALUES.indexOf('9')) {
            node.appendChild(badge('Nell'));
        }
        if (card.value === VALUES.indexOf('Under')) {
            node.appendChild(badge('Puur'));
        }
    }
    // TODO figure out if this is the highest card in play
};

App.prototype.render = function() {
    gameNode.innerHTML = '';
    this['render' + this.mode]();
};

/**
 * Trump handling
 */
App.prototype.renderTrump = function() {
    gameNode.appendChild(p('Welche Farbe ist Trumpf?'));
    gameNode.appendChild(this.getColorList(this.setTrump.bind(this)));
};
App.prototype.getColorList = function(callback) {
    var color, list, button;
    list = node('div');
    for (color = 0; color < COLORS.length; color += 1) {
        button = node('button', COLORS[color], 'color color-' + color);
        button.onclick = callback.bind(this, color);
        list.appendChild(button);
    }
    return list;
};
App.prototype.setTrump = function(color) {
    console.log('trump set to: ' + COLORS[color]);
    this.mode = MODES.DEAL;
    this.state.trump = color;

    var infoNode;
    infoNode = node('div', 'Trumpf: ' + COLORS[color], 'color color-' + color);
    document.getElementById('trump').appendChild(infoNode);
    this.render();
};


/**
 * Dealing cards
 */
App.prototype.renderDeal = function() {
    var cardlist;
    gameNode.appendChild(p('Klick auf die dir ausgeteilten Karten.'));
    gameNode.appendChild(this.getCardListNoHand(this.dealCard.bind(this)));
    gameNode.appendChild(p('Deine Hand:'));
    gameNode.appendChild(this.getCardListHand());
};
App.prototype.dealCard = function(card) {
    console.info('dealt card ', card);
    this.state.hand.push(card);
    if (this.state.hand.length === ROUNDS) {
        this.mode = MODES.ESTIMATE;
    }
    this.render();
};

/**
 * Enter your estimate
 */
App.prototype.renderEstimate = function() {
    gameNode.appendChild(p('Deine Schätzung:'));
    gameNode.appendChild(this.getEstimateForm());
    gameNode.appendChild(p('Deine Hand:'));
    gameNode.appendChild(this.getCardListHand());
    gameNode.appendChild(p('Punktewerte:'));
    var list = node('ul', '', 'float'), i, text, total, points = [], extra = 0;
    for (i = 0; i < ROUNDS; i += 1) {
        points[i] = this.state.hand[i].getPoints(this.state.trump);
        if (points[i] <= 0) {
            continue;
        }
        if (this.state.trump === this.state.hand[i].color) {
            extra += points[i];
        }
        text = this.state.hand[i].toString() + ': ' + points[i];
        list.appendChild(node('li', text));
    }
    gameNode.appendChild(list);
    total = points.sum();
    gameNode.appendChild(p('Total: <b>' + total + '</b>'));
    gameNode.appendChild(p('Trümpfe doppelt gezählt: <b>' + (total + extra) + '</b>'));
};
App.prototype.getEstimateForm = function() {
    var form = node('form');
    form.onsubmit = this.verifyEstimate.bind(this);
    form.appendChild(node('input', {
        type: 'number',
        name: 'estimate',
        value: 0,
        step: 1,
        min: 0,
        max: 157
    }));
    form.appendChild(node('button', {
        innerHTML: 'Schätzen!',
        type: 'submit'
    }));
    return form;
};
App.prototype.verifyEstimate = function(event, value) {
    if (event) {
        event.preventDefault();
    }

    var estimate = value || parseInt(event.target.estimate.value, 10);
    if (estimate >= 0 && estimate <= MAX_POINTS) {
        this.mode = MODES.GIVER;
        this.state.estimate = estimate;
        this.state.points = 0;
        document.getElementById('estimate').style.display = 'block';
        document.getElementById('estimate-guess').innerHTML = estimate;
    }
    this.render();
};


/**
 * Which player goes first?
 */
App.prototype.renderGiver = function() {
    this.showPoints();
    var state = this.state,
        unplayedCards = CARDS.filter(function (card) {
            return state.hand.indexOf(card) === -1
                && state.played.indexOf(card) === -1;
        });

    gameNode.appendChild(p('Klicke auf den Spieler mit der Vorhand:'));
    gameNode.appendChild(this.getPlayerList(this.setGiver.bind(this)));

    gameNode.appendChild(p('Karten im Spiel'));
    gameNode.appendChild(this.getCardList(unplayedCards));

    gameNode.appendChild(p('Deine Hand'));
    gameNode.appendChild(this.getCardListHand());
};
App.prototype.getPlayerList = function(callback) {
    var player, list, button;
    list = node('div');
    for (player = 0; player < PLAYERS.length; player += 1) {
        button = node('button', PLAYERS[player][1], 'color color-' + player);
        button.onclick = callback.bind(this, player);
        list.appendChild(button);
    }
    return list;
};
App.prototype.setGiver = function(player) {
    this.state.giver = player;
    this.mode = MODES.PLAY;
    this.render();
};


/**
 * The main play phase
 */
App.prototype.renderPlay = function() {
    this.showPoints();
    var state = this.state,
        handPoints = state.hand.sum(function (card) {
            if (state.played.indexOf(card) !== -1) {
                return 0;
            }
            return card.getPoints(state.trump);
        }),
        unplayedCards = CARDS.filter(function (card) {
            return state.hand.indexOf(card) === -1
                && state.played.indexOf(card) === -1;
        }),
        unplayedPoints = unplayedCards.sum(function (card) {
            return card.getPoints(state.trump);
        });

    gameNode.appendChild(this.getTrick());

    gameNode.appendChild(p('Karten im Spiel (' + unplayedPoints + ')'));
    gameNode.appendChild(this.getCardList(unplayedCards, this.playCard.bind(this)));

    gameNode.appendChild(p('Deine Hand (' + handPoints + ')'));
    gameNode.appendChild(this.getCardListHand(this.playCard.bind(this)));
};
App.prototype.showPoints = function() {
    document.getElementById('estimate-points').innerHTML = this.state.points;
    document.getElementById('estimate-diff').innerHTML = Math.abs(this.state.estimate - this.state.points);
};
App.prototype.getTrick = function() {
    var state = this.state,
        trick, i, card, currentTrick;
    trick = node('div', '', 'trick');

    if (state.tricks.length <= 0) {
        trick.appendChild(p('Stich ' + state.round + ' / ' + ROUNDS
            + '<br>Klick auf die Karten in gespielter Reihenfolge.'));
        return trick;
    }
    currentTrick = state.tricks[state.tricks.length - 1];

    var trickPoints = currentTrick.cards.sum(function (card) { return card.getPoints(state.trump); });
    trick.appendChild(p('Stich ' + state.round + ' / ' + ROUNDS + ' (' + trickPoints + ')'));

    for (i = 0; i < currentTrick.cards.length; i += 1) {
        card = currentTrick.cards[i].getNode(this.state.trump,
            PLAYERS[(i + currentTrick.giver) % PLAYERS.length][0]);
        this.annotateCard(currentTrick.cards[i], card);
        trick.appendChild(card);
    }
    return trick;
};
App.prototype.playCard = function(card) {
    if (this.state.tricks.length !== this.state.round) {
        console.log('push new trick');
        var giver = this.state.tricks.length === 0 ?
            this.state.giver : this.state.tricks[this.state.tricks.length - 1].winner;
        this.state.tricks.push({
            giver: giver,
            winner: null,
            color: card.color,
            cards: []
        });
    }

    var currentTrick = this.state.tricks[this.state.round - 1];
    currentTrick.cards.push(card);
    this.state.played.push(card);
    console.log('currentTrick', currentTrick);

    this.render();

    if (currentTrick.cards.length === PLAYERS.length) {
        this.state.round += 1;
        // todo calculate winner
        currentTrick.winner = Math.randInt(0, PLAYERS.length);
        console.log('trick over, determining winner', currentTrick.winner);
    }
};


document.addEventListener('DOMContentLoaded', function () {
    var app = new App();
    app.fake(MODES.PLAY);
    app.render();
});

} (this, this.document, void 0));
