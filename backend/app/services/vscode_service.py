import urllib.parse


class VSCodeIntegrationService:
    @staticmethod
    def generate_vscode_clone_url(repository_url: str) -> str:
        """
        Constructs the standard VS Code clone URI handler:
        vscode://vscode.git/clone?url=<ENCODED_REPOSITORY_URL>
        """
        encoded = urllib.parse.quote(repository_url, safe="")
        return f"vscode://vscode.git/clone?url={encoded}"

    @staticmethod
    def generate_vscode_open_folder_url(folder_path: str) -> str:
        """
        Constructs direct VS Code folder open URI handler:
        vscode://file/<NORMALIZED_PATH>
        """
        normalized = folder_path.replace("\\", "/")
        if not normalized.startswith("/"):
            normalized = "/" + normalized
        return f"vscode://file{normalized}"

    @staticmethod
    def generate_git_clone_command(repository_url: str) -> str:
        """
        Generates the standard git clone command.
        """
        return f"git clone {repository_url}"
