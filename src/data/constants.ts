import { Question } from '../types';

export const defaultQuestions: Question[] = [
    {
        question: "Which factor has the biggest impact on milk shelf life?",
        options: ["Temperature control", "Packaging material", "Storage humidity", "Cow's mood"],
        correct: 0
    },
    {
        question: "If we designed a \"Milk-as-a-Service\" platform, what's the hardest problem to solve?",
        options: ["Subscription billing", "Cold-chain logistics", "API uptime", "Preventing milk from spoiling"],
        correct: 3
    },
    {
        question: "Which Kubernetes command is most accurate for milking cows?",
        options: ["kubectl drain cow01", "kubectl get milk", "kubectl describe udder", "kubectl scale herd=10"],
        correct: 0
    },
    {
        question: "If cows were software engineers, which language would they pick?",
        options: ["Python", "Rust", "Golang", "MooScript"],
        correct: 3
    },
    {
        question: "Which technology is most critical for smart dairy farms?",
        options: ["IoT sensors", "Machine Learning models", "Blockchain traceability", "Augmented Reality"],
        correct: 0
    },
    {
        question: "If 1 cow produces 25 liters/day, how many cows are needed for 1 TB of \"milk data\", assuming 1 liter = 1 GB?",
        options: ["10", "40", "100", "None, data doesn't work like that 😅"],
        correct: 2
    },
    {
        question: "What's the nickname for milk in the global dairy trade?",
        options: ["White Oil", "White Gold", "Liquid Silver", "Cloud Juice"],
        correct: 1
    },
    {
        question: "Which cloud service best describes a dairy farm?",
        options: ["AWS EC2 (compute = cows)", "AWS S3 (storage = milk tanks)", "AWS Lambda (events = milking sessions)", "All of the above"],
        correct: 3
    },
    {
        question: "If milk powered servers instead of electricity, which component would it fuel best?",
        options: ["RAM", "GPU", "Cache", "Hard Disk"],
        correct: 2
    },
    {
        question: "Which would be harder to debug?",
        options: ["A distributed system outage", "A herd of cows escaping into traffic", "A memory leak in production", "A milk tank leaking during transport"],
        correct: 1
    }
];

export const appConfig = {
    timerDuration: parseInt(process.env.REACT_APP_DEFAULT_TIMER_DURATION || '20') || 20
};
