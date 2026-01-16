export const CYCLIST_QUOTES = [
  { quote: "It never gets easier, you just go faster.", author: "Greg LeMond" },
  { quote: "Pain is temporary, quitting lasts forever.", author: "Lance Armstrong" },
  { quote: "The bicycle is a curious vehicle. Its passenger is its engine.", author: "John Howard" },
  { quote: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
  { quote: "Don't buy upgrades, ride up grades.", author: "Eddy Merckx" },
  { quote: "It is by riding a bicycle that you learn the contours of a country best.", author: "Ernest Hemingway" },
  { quote: "Ride as much or as little, or as long or as short as you feel. But ride.", author: "Eddy Merckx" },
  { quote: "When the spirits are low, when the day appears dark, when work becomes monotonous, when hope hardly seems worth having, just mount a bicycle.", author: "Arthur Conan Doyle" },
  { quote: "Nothing compares to the simple pleasure of a bike ride.", author: "John F. Kennedy" },
  { quote: "The race is won by the rider who can suffer the most.", author: "Eddy Merckx" },
  { quote: "I thought of that while riding my bike.", author: "Albert Einstein (on his Theory of Relativity)" },
  { quote: "Cyclists see considerably more of this beautiful world than any other class of citizens.", author: "Dr. K.K. Doty" },
  { quote: "A bicycle ride around the world begins with a single pedal stroke.", author: "Scott Stoll" },
  { quote: "Melancholy is incompatible with bicycling.", author: "James E. Starrs" },
  { quote: "The bicycle is the most civilized conveyance known to man.", author: "Iris Murdoch" },
  { quote: "Whoever invented the bicycle deserves the thanks of humanity.", author: "Lord Charles Beresford" },
  { quote: "Every time I see an adult on a bicycle, I no longer despair for the human race.", author: "H.G. Wells" },
  { quote: "Get a bicycle. You will certainly not regret it, if you live.", author: "Mark Twain" },
  { quote: "To ride a bicycle properly is very like a love affair; chiefly it is a matter of faith.", author: "H.G. Wells" },
  { quote: "When I go biking, I repeat a mantra of the day's sensations.", author: "Diane Ackerman" },
  { quote: "Cycling is unique. No other sport lets you go like that.", author: "Greg LeMond" },
  { quote: "The best rides are the ones where you bite off much more than you can chew, and live through it.", author: "Doug Bradbury" },
  { quote: "A bad day on a bike always beats a good day in the office.", author: "Unknown" },
  { quote: "Four wheels move the body, two wheels move the soul.", author: "Unknown" },
  { quote: "Shut up legs!", author: "Jens Voigt" },
]

export function getRandomQuote(): { quote: string; author: string } {
  return CYCLIST_QUOTES[Math.floor(Math.random() * CYCLIST_QUOTES.length)]
}

export function formatQuoteForRide(quoteObj: { quote: string; author: string }): string {
  return `"${quoteObj.quote}" — ${quoteObj.author}`
}
