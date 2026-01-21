/* eslint-disable camelcase */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';
import Loader from './Loader';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';

// AI Feature Imports
import { pdfjs } from "react-pdf";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useResumeContext } from "@/context/ResumeContext";

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const initialValues = {
  dateTime: new Date(),
  description: '',
  link: '',
};

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined
  >(undefined);
  const [values, setValues] = useState(initialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const client = useStreamVideoClient();
  const { user } = useUser();
  const { toast } = useToast();

  // State for AI Features
  const [isGenerating, setIsGenerating] = useState(false);
  const {
    setResumeText,
    setJobRole,
    setJobDescription,
    setQuestions,
    jobRole,
    jobDescription,
    resumeText
  } = useResumeContext();

  const createMeeting = async () => {
    if (!client || !user) return;
    try {
      if (!values.dateTime && meetingState === 'isScheduleMeeting') {
        toast({ title: 'Please select a date and time' });
        return;
      }
      const id = crypto.randomUUID();
      const call = client.call('default', id);
      if (!call) throw new Error('Failed to create meeting');

      const startsAt = values.dateTime.toISOString() || new Date(Date.now()).toISOString();
      const description = values.description || 'Instant Meeting';

      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description,
          },
        },
      });
      setCallDetail(call);

      if (!values.description) { // This condition means it's an instant meeting
        router.push(`/meeting/${call.id}`);
      }

      toast({
        title: 'Meeting Created',
      });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create Meeting' });
    }
  };

  const handleAiMeeting = async () => {
    if (!resumeText || !jobRole) {
      toast({ title: "Please upload a resume and select a job role." });
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Generate Questions
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobRole, jobDescription }),
      });

      if (!response.ok) throw new Error('Failed to generate questions');
      const data = await response.json();
      setQuestions(data.questions);

      toast({ title: "Questions Generated! Starting the meeting..." });

      // 2. Create Meeting
      await createMeeting();

    } catch (error) {
      console.error('Error in AI Meeting Flow:', error);
      toast({ title: 'Error creating AI-powered meeting. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === "application/pdf") {
      const reader = new FileReader();
      reader.readAsArrayBuffer(uploadedFile);
      reader.onload = async () => {
        if (reader.result) {
          const pdf = await pdfjs.getDocument({ data: reader.result as ArrayBuffer }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(" ") + "\n";
          }
          setResumeText(text);
          toast({ title: "Resume parsed successfully!" });
        }
      };
    } else {
      toast({ variant: 'destructive', title: "Please upload a valid PDF file." });
    }
  };

  if (!client || !user) return <Loader />;

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetail?.id}`;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard img="/icons/add-meeting.svg" title="New Meeting" description="Start an instant meeting" handleClick={() => setMeetingState('isInstantMeeting')} />
      <HomeCard img="/icons/join-meeting.svg" title="Join Meeting" description="via invitation link" className="bg-blue-1" handleClick={() => setMeetingState('isJoiningMeeting')} />
      <HomeCard img="/icons/schedule.svg" title="Schedule Meeting" description="Plan your meeting" className="bg-purple-1" handleClick={() => setMeetingState('isScheduleMeeting')} />
      <HomeCard img="/icons/recordings.svg" title="View Recordings" description="Meeting Recordings" className="bg-yellow-1" handleClick={() => router.push('/recordings')} />

      {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={createMeeting}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Add a description
            </label>
            <Textarea
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-3 p-2 focus:outline-none"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Link Copied' });
          }}
          image={'/icons/checked.svg'}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
        />
      )}

      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant AI-Powered Meeting"
        buttonText={isGenerating ? "Generating & Starting..." : "Generate Questions & Start Meeting"}
        handleClick={handleAiMeeting}
      >
        <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-sky-2">Step 1: Upload Candidate's Resume</h2>
            <Input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            
            <h2 className="font-semibold text-sky-2">Step 2: Provide Job Details</h2>
            <Select onValueChange={(value) => setJobRole(value)}>
              <SelectTrigger className="w-full border-none bg-dark-3">
                <SelectValue placeholder="Select Job Role" />
              </SelectTrigger>
              <SelectContent className="bg-dark-3 text-white">
                <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
              </SelectContent>
            </Select>
            
            <Textarea 
              placeholder="Optional: Paste the job description here for more accurate questions..."
              onChange={(e) => setJobDescription(e.target.value)}
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
        </div>
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={() => router.push(values.link)}
      >
        <Input
          placeholder="Meeting link"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;
