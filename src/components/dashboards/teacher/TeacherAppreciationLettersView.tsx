import React from 'react';
import { AuthUser, SchoolTenant } from '../../../types';
import { AppreciationLettersManager } from '../../AppreciationLettersManager';
import { Award, Sparkles, Heart, GraduationCap, School } from 'lucide-react';

interface TeacherAppreciationLettersViewProps {
  currentUser?: AuthUser | null;
  currentSchool?: SchoolTenant | null;
}

export const TeacherAppreciationLettersView: React.FC<TeacherAppreciationLettersViewProps> = ({
  currentUser = null,
  currentSchool = null
}) => {
  return (
    <div className="space-y-6" id="teacher-appreciation-letters-view">
      <AppreciationLettersManager
        currentUser={currentUser}
        currentSchool={currentSchool}
        isTeacherView={true}
      />
    </div>
  );
};
