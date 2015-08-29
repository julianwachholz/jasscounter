(function(window, document, undefined) {
'use strict';

var MODES = {
    TRUMP: 'Trump',
    DEAL: 'Deal',
    ESTIMATE: 'Estimate',
    PLAY: 'Play'
};

var ROUNDS = 9;

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
        round: 1
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
        console.log('[fake] dealt card ' + hand[hand.length - 1].toString());
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
    this.verifyEstimate(null, Math.randInt(total - total * 0.1, total + total * 0.4));
    console.log('[fake] points in hand %d, guesstimate: %d', total, this.state.estimate);

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
    var hand = this.state.hand;
    return this.getCardList(CARDS.filter(function (card) {
        return hand.indexOf(card) !== -1;
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
    if (estimate >= 0 && estimate <= 157) {
        this.mode = MODES.PLAY;
        this.state.estimate = estimate;
        this.state.points = 0;
        document.getElementById('estimate').style.display = 'block';
        document.getElementById('estimate-guess').innerHTML = estimate;
    }
    this.render();
};


/**
 * The main play phase
 */
App.prototype.renderPlay = function() {
    this.showPoints();
    var state = this.state,
        handPoints = state.hand.sum(function (card) {
            return card.getPoints(state.trump);
        }),
        unplayedCards = CARDS.filter(function (card) {
            return state.hand.indexOf(card) === -1
                && state.played.indexOf(card) === -1;
        }),
        unplayedPoints = unplayedCards.sum(function (card) {
            return card.getPoints(state.trump);
        });

    gameNode.appendChild(p('Stich ' + state.round + ' / ' + ROUNDS + '<br>Klick auf die Karten in gespielter Reihenfolge.'));
    gameNode.appendChild(this.getCardsInBet());

    gameNode.appendChild(p('Karten im Spiel (' + unplayedPoints + ')'));
    gameNode.appendChild(this.getCardList(unplayedCards, this.playCard.bind(this)));

    gameNode.appendChild(p('Deine Hand (' + handPoints + ')'));
    gameNode.appendChild(this.getCardListHand(this.playCard.bind(this)));
};
App.prototype.showPoints = function() {
    document.getElementById('estimate-points').innerHTML = this.state.points;
    document.getElementById('estimate-diff').innerHTML = Math.abs(this.state.estimate - this.state.points);
};
App.prototype.getCardsInBet = function() {
    var list = node('div');
    return list;
};
App.prototype.playCard = function(card) {
    console.log('play card', card);
    if (this.state.tricks.length !== this.state.round) {
        this.state.tricks.push({
            winner: null,
            cards: []
        });
    }
    var currentTrick = this.state.tricks[this.state.round - 1];
};


document.addEventListener('DOMContentLoaded', function () {
    var app = new App();
    app.fake(MODES.PLAY);
    app.render();
});

} (this, this.document, void 0));
