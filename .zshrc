# --- Performance: Completion Caching ---
autoload -Uz compinit
for dump in ~/.zcompdump(N.m1); do
    compinit
done
compinit -C

# --- Zsh Configuration ---
[[ -o interactive ]] || return 0
HISTFILE=~/.histfile
HISTSIZE=1000
SAVEHIST=1000
bindkey -e

# --- Aliases ---
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias vim='nvim'
alias ls='eza -la --color=always --group-directories-first'
alias la='eza -a --color=always --group-directories-first'
alias ll='eza -l --color=always --group-directories-first'
alias lt='eza -aT --color=always --group-directories-first'
alias update='paru -Syu --noconfirm --skipreview'
alias paru='paru --bottomup'
alias gtk-theme='gsettings set org.gnome.desktop.interface gtk-theme'
alias icon-theme='gsettings set org.gnome.desktop.interface icon-theme'
alias config='codium /home/gabri/.config/hypr/hyprland.conf'
alias bashrc='codium /home/gabri/.zshrc'
alias zshrc='codium /home/gabri/.zshrc'
alias starship-config='codium ~/.config/starship.toml'
alias keyboard-widget='codium /home/gabri/HyprPanel/modules/menus/notifications/controls/index.ts'
alias google='{read -r arr; browser "https://google.com/search?q=${arr}";} <<<'
alias rr='curl -s -L https://raw.githubusercontent.com/keroserene/rickrollrc/master/roll.sh | bash'

# --- Git Section ---
alias gitconnect='eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519 && ssh -T git@github.com'
alias ga='git add .'
alias gc='git commit -m "Automated commit"'
alias gp='git push origin $(git rev-parse --abbrev-ref HEAD)'
alias gcap='git add . && git commit -m "Automated commit" && git push origin $(git rev-parse --abbrev-ref HEAD)'

# # --- PWA & Capacitor Section ---
# pwa-release() {
#     # Check for version argument
#     if [[ -z "$1" ]]; then
#         print -P "%F{1}Error: Please provide a version (e.g., pwa-release v0.1.3)%f"
#         return 1
#     fi

#     # Verify GitHub CLI and jq are installed
#     if ! command -v gh &> /dev/null || ! command -v jq &> /dev/null; then
#         print -P "%F{1}Error: 'gh' and 'jq' are required.%f"
#         print -P "Run: paru -S github-cli jq"
#         return 1
#     fi

#     # Extract app name and normalize version string
#     local app_name=$(jq -r '.name' package.json 2>/dev/null || echo "app")
#     local raw_version="${1#v}"
#     local tag_version="v${raw_version}"
#     local final_apk_name="${app_name}_${tag_version}.apk"

#     print -P "%F{4}>>> Updating package.json to ${raw_version}...%f"
#     npm version "$raw_version" --no-git-tag-version || { print -P "%F{1}npm version failed%f"; return 1; }

#     print -P "%F{4}>>> Updating build.gradle version metadata...%f"
#     local gradle_file="android/app/build.gradle"
#     if [[ -f "$gradle_file" ]]; then
#         # Increment versionCode
#         local current_code=$(grep -oP 'versionCode \K\d+' "$gradle_file" 2>/dev/null)
#         if [[ -n "$current_code" ]]; then
#             local next_code=$((current_code + 1))
#             sed -i "s/versionCode $current_code/versionCode $next_code/" "$gradle_file"
#         fi
#         # Update versionName
#         sed -i -E "s/(versionName \")[^\"]+(\")/\1${raw_version}\2/" "$gradle_file"
#     else
#         print -P "%F{3}Warning: android/app/build.gradle not found, skipping Android version bump.%f"
#     fi

#     print -P "%F{4}>>> Building PWA and syncing Android...%f"
#     npm run build && npx cap sync android || { print -P "%F{1}Build failed%f"; return 1; }

#     print -P "%F{4}>>> Compiling Release APK...%f"
#     (cd android && ./gradlew assembleRelease) || { print -P "%F{1}Gradle failed%f"; return 1; }

#     # Locate and rename APK
#     local apk_path="android/app/build/outputs/apk/release/app-release.apk"
#     if [[ ! -f "$apk_path" ]]; then
#         # Fallback if unsigned
#         apk_path=$(ls android/app/build/outputs/apk/release/*.apk | head -n 1)
#     fi

#     if [[ -f "$apk_path" ]]; then
#         mv "$apk_path" "$final_apk_name"
#         apk_path="$final_apk_name"
#     else
#         print -P "%F{1}Error: APK not found.%f"
#         return 1
#     fi

#     print -P "%F{4}>>> Pushing to Git...%f"
#     git add .
#     git commit -m "chore(release): ${tag_version}"
#     git push origin $(git rev-parse --abbrev-ref HEAD) || { print -P "%F{1}Git push failed%f"; return 1; }

#     print -P "%F{4}>>> Creating GitHub Release ${tag_version}...%f"
#     gh release create "$tag_version" "$apk_path" --title "$tag_version" --generate-notes || { print -P "%F{1}GitHub release failed%f"; return 1; }
    
#     print -P "%F{2}Release complete!%f"
# }

# --- Path & Environment ---
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
export PATH="$PATH:/home/gabri/.local/bin"

# Suppress OpenSSL legacy provider warnings (Conda/Python)
export PYTHONWARNINGS="ignore:OpenSSL 3's legacy provider failed to load"

# --- The Prompt Logic ---
path_logic() {
    local p="${(%):-%~}"
    if [[ "$p" == "~" ]]; then
        echo ""
    else
        echo " | %F{3}$p%f"
    fi
}

setopt prompt_subst
PROMPT='%(#.%F{2}.%F{1})%f$(path_logic) > '

# --- Lazy Loaders ---
pyenv() {
    unset -f pyenv
    export PYENV_ROOT="$HOME/.pyenv"
    [[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)"
    pyenv "$@"
}

conda() {
    unset -f conda
    if [ -f "/opt/miniconda3/etc/profile.d/conda.sh" ]; then
        . "/opt/miniconda3/etc/profile.d/conda.sh"
    else
        export PATH="/opt/miniconda3/bin:$PATH"
    fi
    __conda_setup="$('/opt/miniconda3/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
    [[ $? -eq 0 ]] && eval "$__conda_setup"
    unset __conda_setup
    conda "$@"
}

export CAPACITOR_ANDROID_STUDIO_PATH=/opt/android-studio/bin/studio.sh