import { AlertCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { useProblemsStore, Problem } from '../store/useProblemsStore';
import { useStore } from '../store/useStore';

export default function ProblemsPanel() {
  const { problems } = useProblemsStore();
  const { openFile } = useStore();

  const handleProblemClick = (problem: Problem) => {
    // Open file and navigate to line
    openFile({
      path: problem.file,
      name: problem.file.split('/').pop() || problem.file,
      content: '', // Will be loaded
      language: 'plaintext',
      isDirty: false
    });
  };

  const getSeverityIcon = (severity: Problem['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle size={14} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-yellow-400" />;
      case 'info':
        return <Info size={14} className="text-blue-400" />;
    }
  };

  const groupedProblems = problems.reduce((acc, problem) => {
    if (!acc[problem.file]) {
      acc[problem.file] = [];
    }
    acc[problem.file].push(problem);
    return acc;
  }, {} as Record<string, Problem[]>);

  return (
    <div className="h-full bg-[#1e1e1e] overflow-y-auto">
      {problems.length === 0 ? (
        <div className="flex items-center justify-center h-full text-[#858585]">
          <div className="text-center">
            <Info size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No problems detected</p>
          </div>
        </div>
      ) : (
        <div className="p-2">
          {Object.entries(groupedProblems).map(([file, fileProblems]) => (
            <div key={file} className="mb-4">
              <div className="flex items-center gap-2 text-sm text-[#cccccc] mb-2 px-2">
                <ChevronRight size={14} />
                <span className="font-medium">{file}</span>
                <span className="text-[#858585]">({fileProblems.length})</span>
              </div>
              
              {fileProblems.map((problem) => (
                <div
                  key={problem.id}
                  onClick={() => handleProblemClick(problem)}
                  className="flex items-start gap-2 px-4 py-2 hover:bg-[#2a2d2e] cursor-pointer text-sm"
                >
                  {getSeverityIcon(problem.severity)}
                  <div className="flex-1">
                    <div className="text-[#cccccc]">{problem.message}</div>
                    <div className="text-[#858585] text-xs mt-1">
                      [{problem.line}, {problem.column}] - {problem.source}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
