# Protocol Puzzle 🧩

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Docker](https://img.shields.io/badge/docker-supported-blue)

**Protocol Puzzle** is a visual, block-based parser generator. It bridges the gap between abstract binary/text protocol definitions and concrete implementation code. Define your protocol using a drag-and-drop puzzle interface and instantly generate high-performance parsing code for C++, C#, and Python.

It includes a **Virtual Test Lab** powered by GenAI (Google Gemini or OpenAI) to simulate parsing logic against raw Hex data before you even compile your code.

## ✨ Features

- **Visual Editor**: Drag-and-drop interface to define Structs, Lists, Primitives, and Bitfields.
- **Multi-Language Support**: Generate idiomatic code for C#, C++, and Python.
- **AI-Powered Simulation**: Test your protocol logic immediately with a "Virtual Runtime" that parses Hex strings on the fly.
- **Dual AI Provider**: Support for Google Gemini (Flash 2.5) and OpenAI (GPT-4).
- **Drag & Drop Reordering**: Easily restructure your protocol definitions.

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Edge, Firefox).
- An API Key for **Google Gemini** or **OpenAI**.

### Running Locally (No Install)

This project uses modern ES Modules via `esm.sh`. You can serve it using any static file server.

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/protocol-puzzle.git
    cd protocol-puzzle
    ```

2.  Start a static server (e.g., using Python):
    ```bash
    # Python 3
    python -m http.server 8080
    ```

3.  Open `http://localhost:8080` in your browser.

4.  Click the **Settings (Gear Icon)** in the top right to configure your API Key.

### 🐳 Running with Docker

We provide a Docker configuration for easy deployment.

**Option 1: Using Docker Compose (Recommended)**

```bash
# Build and start the container
docker-compose up -d --build
```
Access the app at `http://localhost:8080`.

**Option 2: Building Manually**

```bash
docker build -t protocol-puzzle .
docker run -p 8080:80 protocol-puzzle
```

## 🗺️ Roadmap

We aim to make Protocol Puzzle the standard tool for rapid protocol prototyping.

### Phase 1: Core Foundation (Completed ✅)
- [x] Basic Block Structure (Int, String, Float)
- [x] Complex Types (Nested Structs, Repeated Lists, Bitfields)
- [x] Recursive Visual Rendering
- [x] Code Generation (C#, C++, Python)
- [x] Virtual Test Lab (GenAI Simulation)
- [x] Drag & Drop Reordering
- [x] Multi-Provider Support (Google & OpenAI)

### Phase 2: Enhanced Protocol Logic (Upcoming 🚧)
- [ ] **Endianness Control**: Toggle Big/Little Endian per field or globally.
- [ ] **Conditional Fields**: Support "If-Else" blocks (e.g., *if field_A == 1, then parse field_B*).
- [ ] **Enums**: First-class support for Enum definitions and mapping.
- [ ] **Computed Fields**: Fields that derive values from others (Length, Checksums).

### Phase 3: Ecosystem & Integration
- [ ] **Protobuf Import/Export**: Convert `.proto` files to Puzzle blocks and vice versa.
- [ ] **Pcap Integration**: Upload a `.pcap` file and attempt to auto-generate a schema.
- [ ] **Project Persistence**: Save/Load projects to LocalStorage or a JSON file.
- [ ] **Syntax Highlighting**: PrismJS integration for the code viewer.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
