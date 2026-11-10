import abc
import os
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class GitProviderInterface(abc.ABC):
    @abc.abstractmethod
    def create_repository(self, instance_id: str, repo_name: str, description: str) -> str:
        """Creates a repository and returns its cloneable URL."""
        pass


class LocalBareGitProvider(GitProviderInterface):
    """
    Creates and manages bare Git repositories locally on the server filesystem.
    Produces cloneable file URLs or network paths suitable for local and network testing.
    """
    def __init__(self, base_repo_dir: Path):
        self.base_repo_dir = base_repo_dir
        self.base_repo_dir.mkdir(parents=True, exist_ok=True)

    def create_repository(self, instance_id: str, repo_name: str, description: str) -> str:
        # git-repos/<instance_id>/<project-name>.git  -> VS Code names the cloned folder "<project-name>"
        repo_path = self.base_repo_dir / instance_id / f"{repo_name}.git"
        if not repo_path.exists():
            repo_path.mkdir(parents=True, exist_ok=True)
            # Initialize bare repository
            result = subprocess.run(
                ["git", "init", "--bare", "--initial-branch=main"],
                cwd=str(repo_path),
                capture_output=True,
                text=True,
                check=False
            )
            if result.returncode != 0:
                logger.error(f"Failed to create bare git repo: {result.stderr}")
                raise RuntimeError(f"Git bare init failed: {result.stderr}")

        # Return file URI or normalized path clone URL
        # For Windows VS Code git clone, standard normalized path or file:/// is supported
        normalized = str(repo_path.resolve()).replace("\\", "/")
        return f"file:///{normalized}"


class GitRepositoryService:
    def __init__(self):
        repos_dir = settings.GENERATED_DIR / "git-repos"
        repos_dir.mkdir(parents=True, exist_ok=True)

        self.provider = LocalBareGitProvider(repos_dir)

    def provision_instance_repository(
        self,
        instance_id: str,
        prototype_id: str,
        working_dir: Path,
        project_name: str,
        user_name: str = "PrototypeHub User",
        user_email: str = "user@prototypehub.local"
    ) -> str:
        """
        1. Creates isolated Git repository via configured provider.
        2. Initializes git in the instance copy.
        3. Configures local git user.
        4. Adds all files, makes initial commit.
        5. Adds remote origin and pushes to main.
        """
        repo_name = project_name
        description = f"Hosted instance {instance_id} for prototype {prototype_id}"
        repo_url = self.provider.create_repository(instance_id, repo_name, description)

        # Initialize local working directory
        try:
            # git init
            subprocess.run(
                ["git", "init", "-b", "main"],
                cwd=str(working_dir),
                capture_output=True,
                text=True,
                check=True
            )

            # git config user
            subprocess.run(
                ["git", "config", "user.name", user_name],
                cwd=str(working_dir),
                capture_output=True,
                check=True
            )
            subprocess.run(
                ["git", "config", "user.email", user_email],
                cwd=str(working_dir),
                capture_output=True,
                check=True
            )

            # git add .
            subprocess.run(
                ["git", "add", "."],
                cwd=str(working_dir),
                capture_output=True,
                text=True,
                check=True
            )

            # git commit
            subprocess.run(
                ["git", "commit", "-m", f"Initial commit for hosted instance {instance_id}"],
                cwd=str(working_dir),
                capture_output=True,
                text=True,
                check=True
            )

            # git remote add origin <repo_url>
            subprocess.run(
                ["git", "remote", "add", "origin", repo_url],
                cwd=str(working_dir),
                capture_output=True,
                text=True,
                check=True
            )

            # git push -u origin main
            subprocess.run(
                ["git", "push", "-u", "origin", "main"],
                cwd=str(working_dir),
                capture_output=True,
                text=True,
                check=True
            )

            logger.info(f"Successfully initialized and pushed instance repository {instance_id} to {repo_url}")
            return repo_url

        except subprocess.CalledProcessError as e:
            logger.error(f"Git execution failed during instance provisioning: {e.stderr}")
            raise RuntimeError(f"Git setup failed: {e.stderr or e.stdout}")
