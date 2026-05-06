import { PROJECT_REPO_URL } from '../config/repo';

interface RepoLinkProps {
  filePath: string;
  children?: any;
  class?: string;
}

export default function RepoLink(props: RepoLinkProps) {
  const fullUrl = () => `${PROJECT_REPO_URL}/${props.filePath}`;
  
  return (
    <a
      href={fullUrl()}
      target="_blank"
      rel="noopener noreferrer"
      class={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors ${props.class || ''}`}
    >
      {props.children || (
        <>
          <svg 
            class="w-4 h-4" 
            fill="currentColor" 
            viewBox="0 0 24 24" 
            aria-hidden="true"
          >
            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.516-4.477-10-10-10z" clip-rule="evenodd" />
          </svg>
          <span>View source</span>
        </>
      )}
    </a>
  );
}