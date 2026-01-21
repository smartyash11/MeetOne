'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ResumeContextType {
  resumeText: string;
  jobRole: string;
  jobDescription: string;
  isLoading: boolean;
  questions: any[];
  setResumeText: (text: string) => void;
  setJobRole: (role: string) => void;
  setJobDescription: (description: string) => void;
  setIsLoading: (loading: boolean) => void;
  setQuestions: (questions: any[]) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resumeText, setResumeText] = useState<string>('');
  const [jobRole, setJobRole] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<any[]>([]);

  return (
    <ResumeContext.Provider
      value={{
        resumeText,
        jobRole,
        jobDescription,
        isLoading,
        questions,
        setResumeText,
        setJobRole,
        setJobDescription,
        setIsLoading,
        setQuestions,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResumeContext = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResumeContext must be used within a ResumeContextProvider');
  }
  return context;
};
