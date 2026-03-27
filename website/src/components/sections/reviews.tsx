import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Sarah M.",
    role: "Parent of 3rd Grader",
    text: "Paula transformed my daughter's relationship with math. She went from tears during homework to actually asking for extra problems!",
    rating: 5,
  },
  {
    name: "David L.",
    role: "Parent of 7th Grader",
    text: "The group tutoring sessions are incredible. My son loves the collaborative approach and his confidence has skyrocketed.",
    rating: 5,
  },
  {
    name: "Jennifer K.",
    role: "Parent of Twins, K & 2nd Grade",
    text: "Mathitude's workbooks are a staple in our house. The puzzles make math feel like a game, not a chore.",
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          className="w-4 h-4 fill-mathitude-orange text-mathitude-orange"
        />
      ))}
    </div>
  );
}

export function Reviews() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-mathitude-navy text-center">
          What Parents Are Saying
        </h2>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <Card
              key={review.name}
              className="border border-gray-100 shadow-sm"
            >
              <CardContent className="pt-6 pb-6 px-6">
                <Stars count={review.rating} />
                <p className="mt-4 text-gray-700 leading-relaxed italic">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-semibold text-mathitude-navy text-sm">
                    {review.name}
                  </p>
                  <p className="text-xs text-gray-500">{review.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
