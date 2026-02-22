declare interface AudioBufferSourceNode {
	metadata: {
		paused: boolean;
		stopped: boolean;
		reply: boolean;
		seek: boolean;
		loop: boolean;
	};
}
