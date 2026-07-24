import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Music,
  Trash2,
} from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useFileUpload } from "../blob-storage/FileStorage";
import { useActor } from "../hooks/useActor";
import {
  useGetBackgroundMusic,
  useRemoveBackgroundMusicTrack,
  useSetActiveBackgroundMusicTrack,
  useSetBackgroundMusicEnabled,
  useSetBackgroundMusicPlaylist,
} from "../hooks/useQueries";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function AdminBackgroundMusicManager() {
  const { actor } = useActor();
  const { uploadFile, isUploading } = useFileUpload();
  const { data: backgroundMusic, isLoading } = useGetBackgroundMusic();
  const setActiveTrack = useSetActiveBackgroundMusicTrack();
  const removeTrack = useRemoveBackgroundMusicTrack();
  const setMusicEnabledMutation = useSetBackgroundMusicEnabled();
  const setPlaylistOrderMutation = useSetBackgroundMusicPlaylist();

  const [musicEnabled, setMusicEnabled] = React.useState(false);

  useEffect(() => {
    if (backgroundMusic) {
      setMusicEnabled(!!backgroundMusic.musicEnabled);
    }
  }, [backgroundMusic]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);

  // Tracks sorted by uploadTimestamp = default playlist order
  const sortedTracks = [...(backgroundMusic?.tracks ?? [])].sort(
    (a, b) => Number(a.uploadTimestamp) - Number(b.uploadTimestamp),
  );
  const [localPlaylistOrder, setLocalPlaylistOrder] = useState<string[]>([]);

  useEffect(() => {
    if (backgroundMusic?.tracks) {
      const sorted = [...backgroundMusic.tracks].sort(
        (a, b) => Number(a.uploadTimestamp) - Number(b.uploadTimestamp),
      );
      setLocalPlaylistOrder(sorted.map((t) => t.path));
    }
  }, [backgroundMusic?.tracks]);

  const handleToggleMusicEnabled = async () => {
    setIsTogglingEnabled(true);
    try {
      const next = !musicEnabled;
      await setMusicEnabledMutation.mutateAsync(next);
      setMusicEnabled(next);
      toast.success(
        next ? "Background music enabled" : "Background music disabled",
      );
    } catch {
      toast.error("Failed to toggle background music");
    } finally {
      setIsTogglingEnabled(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...localPlaylistOrder];
    [newOrder[index - 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index - 1],
    ];
    setLocalPlaylistOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index >= localPlaylistOrder.length - 1) return;
    const newOrder = [...localPlaylistOrder];
    [newOrder[index], newOrder[index + 1]] = [
      newOrder[index + 1],
      newOrder[index],
    ];
    setLocalPlaylistOrder(newOrder);
  };

  const handleSavePlaylistOrder = async () => {
    setIsSavingPlaylist(true);
    try {
      await setPlaylistOrderMutation.mutateAsync(localPlaylistOrder);
      toast.success("Playlist order saved");
    } catch {
      toast.error("Failed to save playlist order");
    } finally {
      setIsSavingPlaylist(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["audio/mpeg", "audio/ogg", "audio/wav", "audio/mp3"];
      if (
        !validTypes.includes(file.type) &&
        !file.name.match(/\.(mp3|ogg|wav)$/i)
      ) {
        toast.error("Please select a valid audio file (.mp3, .ogg, or .wav)");
        return;
      }
      setSelectedFile(file);
      if (!trackTitle) {
        setTrackTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !actor) {
      toast.error("Please select an audio file");
      return;
    }

    if (!trackTitle.trim()) {
      toast.error("Please enter a track title");
      return;
    }

    try {
      const path = `background-music/${Date.now()}-${selectedFile.name}`;

      const result = await uploadFile(path, selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      await actor.uploadBackgroundMusicTrack({
        path: result.path,
        title: trackTitle.trim(),
        artist: trackArtist.trim() || "Unknown Artist",
        uploadTimestamp: BigInt(Date.now()),
        isActive: false,
      });

      toast.success("Background music track uploaded successfully");
      setSelectedFile(null);
      setTrackTitle("");
      setTrackArtist("");
      setUploadProgress(0);

      const fileInput = document.getElementById(
        "audio-file-input",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload background music track");
    }
  };

  const handleSetActive = async (trackPath: string) => {
    try {
      await setActiveTrack.mutateAsync(trackPath);
      toast.success("Active background music track updated");
    } catch (error) {
      console.error("Set active error:", error);
      toast.error("Failed to set active track");
    }
  };

  const handleRemove = async (trackPath: string) => {
    if (!confirm("Are you sure you want to remove this track?")) {
      return;
    }

    try {
      await removeTrack.mutateAsync(trackPath);
      toast.success("Background music track removed");
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove track");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  const tracks = backgroundMusic?.tracks || [];
  const _activeTrackPath = backgroundMusic?.tracks?.find(
    (t) => t.isActive,
  )?.path;

  return (
    <div className="space-y-8">
      {/* Music Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Background Music
          </h3>
          <p className="text-sm text-gray-500">
            {musicEnabled
              ? "Currently playing for visitors"
              : "Currently disabled for visitors"}
          </p>
        </div>
        <Button
          onClick={handleToggleMusicEnabled}
          disabled={isTogglingEnabled}
          variant={musicEnabled ? "outline" : "default"}
          size="sm"
        >
          {isTogglingEnabled ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : musicEnabled ? (
            "Disable Music"
          ) : (
            "Enable Music"
          )}
        </Button>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Upload Background Music
        </h3>
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div>
            <Label htmlFor="audio-file-input">
              Audio File (.mp3, .ogg, .wav)
            </Label>
            <Input
              id="audio-file-input"
              type="file"
              accept=".mp3,.ogg,.wav,audio/mpeg,audio/ogg,audio/wav"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="mt-1"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="track-title">Track Title</Label>
            <Input
              id="track-title"
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              placeholder="Enter track title"
              disabled={isUploading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="track-artist">Artist (Optional)</Label>
            <Input
              id="track-artist"
              type="text"
              value={trackArtist}
              onChange={(e) => setTrackArtist(e.target.value)}
              placeholder="Enter artist name"
              disabled={isUploading}
              className="mt-1"
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || !trackTitle.trim()}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Music className="w-4 h-4 mr-2" />
                Upload Track
              </>
            )}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Uploaded Tracks
        </h3>
        {tracks.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No background music tracks uploaded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {tracks.map((track) => (
              <div
                key={track.path}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  track.isActive
                    ? "border-black bg-gray-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Music
                    className={`w-5 h-5 ${track.isActive ? "text-black" : "text-gray-400"}`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{track.title}</p>
                    <p className="text-sm text-gray-600">{track.artist}</p>
                  </div>
                  {track.isActive && (
                    <div className="flex items-center space-x-1 text-black">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!track.isActive && (
                    <Button
                      onClick={() => handleSetActive(track.path)}
                      disabled={setActiveTrack.isPending}
                      variant="outline"
                      size="sm"
                    >
                      Set Active
                    </Button>
                  )}
                  <Button
                    onClick={() => handleRemove(track.path)}
                    disabled={removeTrack.isPending}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playlist Order */}
      {localPlaylistOrder.length > 1 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Playlist Order
          </h3>
          <div className="space-y-2 mb-4">
            {localPlaylistOrder.map((path, index) => {
              const track = tracks.find((t) => t.path === path);
              if (!track) return null;
              return (
                <div
                  key={path}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {track.title}
                      </p>
                      <p className="text-xs text-gray-500">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index >= localPlaylistOrder.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={handleSavePlaylistOrder} disabled={isSavingPlaylist}>
            {isSavingPlaylist ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Playlist Order
              </>
            )}
          </Button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          Background Music Settings
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Music plays automatically at 50% volume</li>
          <li>• 3-second fade-in when starting</li>
          <li>• 3-second fade-out when pausing</li>
          <li>• Loops continuously throughout the app</li>
          <li>• Compatible with browser autoplay policies</li>
        </ul>
      </div>
    </div>
  );
}
