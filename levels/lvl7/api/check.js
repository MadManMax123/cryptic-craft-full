export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { answer } = req.body;

  const correctAnswer = parseFloat(process.env.NODE7_ANSWER); // 0.2567
  const flag = process.env.NODE7_FLAG;

  const userAnswer = parseFloat(answer);

  const tolerance = 4;

  if (Math.abs(userAnswer - correctAnswer) <= tolerance) {
    return res.status(200).json({
      correct: true,
      flag: flag
    });
  }

  return res.status(200).json({
    correct: false
  });
}
