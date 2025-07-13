import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Atom, 
  FlaskConical, 
  Calculator, 
  BookOpen, 
  FileText, 
  Timer, 
  Target,
  TrendingUp,
  Share2,
  Download
} from "lucide-react";
import { Logo } from "./Logo";

interface User {
  name: string;
  email: string;
  phone: string;
}

interface DashboardProps {
  user: User;
}

const subjects = [
  {
    id: 'physics',
    name: 'Physics',
    icon: Atom,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-200',
    topics: ['Thermodynamics', 'Waves & Oscillations', 'Mechanics', 'Electricity & Magnetism'],
    practiceTests: 15,
    conceptNotes: 8,
    weakTopics: ['Thermodynamics', 'Waves']
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: FlaskConical,
    color: 'from-green-500 to-green-600',
    borderColor: 'border-green-200',
    topics: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Chemical Bonding'],
    practiceTests: 12,
    conceptNotes: 6,
    weakTopics: ['Organic Chemistry']
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: Calculator,
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-200',
    topics: ['Calculus', 'Algebra', 'Coordinate Geometry', 'Trigonometry'],
    practiceTests: 18,
    conceptNotes: 10,
    weakTopics: ['Calculus']
  }
];

export const Dashboard = ({ user }: DashboardProps) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Achievers Club - KCET Preparation',
        text: 'Join me in preparing for KCET with Achievers Club!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleDownloadPDF = () => {
    // Simulate PDF download
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'achievers-club-study-plan.pdf';
    link.click();
    alert('Study plan PDF would be downloaded here!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="border-brand-red text-brand-red hover:bg-brand-red hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-brand-black">{user.name}</span>
                <span className="text-xs text-muted-foreground">KCET Aspirant</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black mb-2">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Ready to conquer your weak topics and ace KCET? Let's focus on what matters most.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Practice Tests</p>
                  <p className="text-2xl font-bold text-brand-red">45</p>
                </div>
                <Target className="w-8 h-8 text-brand-red" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concept Notes</p>
                  <p className="text-2xl font-bold text-brand-green">24</p>
                </div>
                <BookOpen className="w-8 h-8 text-brand-green" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time Saved</p>
                  <p className="text-2xl font-bold text-brand-black">2.5h</p>
                </div>
                <Timer className="w-8 h-8 text-brand-black" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Improvement</p>
                  <p className="text-2xl font-bold text-accent">+15%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subjects Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-brand-black mb-6">Your KCET Subjects</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              
              return (
                <Card 
                  key={subject.id} 
                  className={`border-2 ${subject.borderColor} hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1`}
                  onClick={() => setSelectedSubject(subject.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${subject.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="outline" className="text-brand-red border-brand-red">
                        Focus Area
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-brand-black">{subject.name}</CardTitle>
                    <CardDescription>
                      Master your weak topics with targeted practice
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Weak Topics Alert */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 mb-1">⚠️ Weak Topics:</p>
                      <div className="flex flex-wrap gap-1">
                        {subject.weakTopics.map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs bg-red-100 text-red-700">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Resources */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-brand-black">{subject.practiceTests}</p>
                          <p className="text-xs text-muted-foreground">Practice Tests</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-brand-black">{subject.conceptNotes}</p>
                          <p className="text-xs text-muted-foreground">Concept Notes</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-brand-red hover:bg-brand-red/90"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Practice
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Special Physics Focus Section */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-xl text-brand-black flex items-center">
              🔬 Special Focus: Physics Mastery
              <Badge className="ml-2 bg-brand-red">High Priority</Badge>
            </CardTitle>
            <CardDescription>
              Dedicated resources for your most challenging topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-brand-black mb-2">🌡️ Thermodynamics Deep Dive</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Master heat engines, entropy, and gas laws with step-by-step solutions
                </p>
                <Button size="sm" className="bg-brand-red hover:bg-brand-red/90">
                  Start Learning
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-brand-black mb-2">🌊 Waves & Oscillations</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Understand wave properties, interference, and harmonic motion
                </p>
                <Button size="sm" className="bg-brand-red hover:bg-brand-red/90">
                  Start Learning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};