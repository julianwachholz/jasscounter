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

/**
 * card counter app
 */
var App = function(mode) {
    this.mode = mode;
    this.reset();
};
App.prototype.reset = function() {
    this.state = {
        trump: null,
        hand: [],
        played: [],
        turns: [],
        estimate: null,
        points: null,
        round: 1
    };
};

/**
 * Creates a list of all cards
 */
App.prototype.getCardList = function(cards, callback, dontBreak) {
    var list, i, card, previousColor = 0;
    list = node('div');
    for (i = 0; i < cards.length; i += 1) {
        card = cards[i].getNode(this.state.trump);
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
    var list = node('ul', {className:'float'}), i, text, total, points = [], extra = 0;
    for (i = 0; i < this.state.hand.length; i += 1) {
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
    gameNode.appendChild(p('Trümpfe doppelt: <b>' + (total + extra) + '</b>'));
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
App.prototype.verifyEstimate = function(event) {
    event.preventDefault();
    var estimate = parseInt(event.target.estimate.value, 10);
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

    gameNode.appendChild(p('Runde ' + state.round + ' / ' + ROUNDS));

    gameNode.appendChild(p('Karten im Spiel (' + unplayedPoints + ')'));
    gameNode.appendChild(this.getCardList(unplayedCards));

    gameNode.appendChild(p('Deine Hand (' + handPoints + ')'));
    gameNode.appendChild(this.getCardListHand());
};
App.prototype.showPoints = function() {
    document.getElementById('estimate-points').innerHTML = this.state.points;
    document.getElementById('estimate-diff').innerHTML = Math.abs(this.state.estimate - this.state.points);
};


document.addEventListener('DOMContentLoaded', function () {
    // var app = new App(MODES.TRUMP);
    var app = new App(MODES.DEAL);
    app.render();
});

} (this, this.document, void 0));
