import 'dart:math';

import 'package:ccim_client/main.dart';
import 'package:ccim_client/utils.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

class AddClipPage extends StatelessWidget {
  const AddClipPage({super.key});

  @override
  Widget build(BuildContext context) {
    return MyScaffold(body: AddClipsBody());
  }
}

class AddClipsBody extends StatefulWidget {
  const AddClipsBody({super.key});

  @override
  State<AddClipsBody> createState() => _AddClipsBodyState();
}

class _AddClipsBodyState extends State<AddClipsBody> {
  int _currentStep = 0;
  final PasteData pasteData = PasteData();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Stepper(
        controlsBuilder: controlsBuilder,
        currentStep: _currentStep,
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() {
              _currentStep -= 1;
            });
          }
        },
        onStepContinue: () {
          if (_currentStep <= 1) {
            setState(() {
              _currentStep += 1;
            });
          }
        },
        onStepTapped: (int index) {
          setState(() {
            _currentStep = index;
          });
        },
        steps: [
          Step(
            title: Text('Details'),
            content: DetailsStep(),
            isActive: _currentStep == 0,
          ),
          Step(
            title: Text('Paste'),
            content: PasteStep(pasteData: pasteData),
            isActive: _currentStep == 1,
          ),
          Step(
            title: Text('Protections'),
            content: ProtectionsStep(),
            isActive: _currentStep == 2,
          ),
        ],
      ),
    );
  }

  Widget controlsBuilder(context, details) {
    return Row(
      spacing: 20,
      children: [
        TextButton(
          onPressed: details.onStepContinue,
          style: TextButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(3),
            ),
            backgroundColor: Colors.blue.shade600,
            foregroundColor: Colors.white,
          ),
          child: const Text('Next'),
        ),
        TextButton(
          onPressed: details.onStepCancel,
          style: TextButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(3),
            ),
            foregroundColor: Colors.black,
            // overlayColor: Colors.transparent,
          ),
          child: const Text('Back'),
        ),
      ],
    );
  }
}

class PasteStep extends StatefulWidget {
  const PasteStep({super.key, required this.pasteData});

  final PasteData pasteData;

  @override
  State<PasteStep> createState() => _PasteStepState();
}

class _PasteStepState extends State<PasteStep> with TickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: [Tab(text: "Text"), Tab(text: "File")],
        ),
        SizedBox(
          height: 200,
          child: TabBarView(
            controller: _tabController,
            children: [TextSection(), FileSection(pasteData: widget.pasteData)],
          ),
        ),
      ],
    );
  }
}

class FileSection extends StatelessWidget {
  const FileSection({super.key, required this.pasteData});

  final PasteData pasteData;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: FilledButton.icon(
        icon: Icon(Icons.upload),
        onPressed: () => handleFilePicker(context),
        label: Text("Select a File"),
        style: ElevatedButton.styleFrom(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(3)),
          backgroundColor: Colors.blue.shade600,
        ),
      ),
    );
  }

  void handleFilePicker(BuildContext context) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
    );
    if (result == null) {
      if (context.mounted) {
        showOkDialog(
          context,
          'No file selected',
          'Please select one/more files to send',
        );
      }
      return;
    }
    try {
      pasteData.filesData.setFiles(result.files);
    } catch (e) {
      if (context.mounted) {
        if (e is MaxTotalFileSizeExceededException) {
          showOkDialog(context, 'Size limit exceeded', e.toString());
          return;
        } else {
          showOkDialog(context, 'Error', e.toString());
        }
      }
    }
    if (context.mounted) {
      int totalSize = pasteData.filesData.totalSize;
      showOkDialog(
        context,
        'SUCCESS',
        'Total file size detected: $totalSize bytes',
      );
    }
    // TODO
  }
}

class TextSection extends StatelessWidget {
  const TextSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        children: [
          Text("This is the text section", style: TextStyle(fontSize: 20)),
          SizedBox(height: 20),
          TextField(decoration: InputDecoration(labelText: "Enter some text")),
        ],
      ),
    );
  }
}

class DetailsStep extends StatelessWidget {
  DetailsStep({super.key});

  final List<String> animals = [
    'lion',
    'tiger',
    'elephant',
    'zebra',
    'giraffe',
    'panda',
    'koala',
    'kangaroo',
    'wolf',
    'shark',
  ];

  final List<String> colors = [
    'red',
    'blue',
    'green',
    'yellow',
    'black',
    'white',
    'purple',
    'orange',
    'brown',
    'pink',
  ];

  final List<String> elements = [
    'hydrogen',
    'oxygen',
    'nitrogen',
    'carbon',
    'helium',
    'neon',
    'sodium',
    'iron',
    'gold',
    'silver',
  ];

  String getRandomName() {
    final Random random = Random();
    String randomAnimal = animals[random.nextInt(animals.length)];
    String randomColor = colors[random.nextInt(colors.length)];
    String randomElement = elements[random.nextInt(elements.length)];
    return '$randomColor-$randomElement-$randomAnimal';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: TextFormField(
        initialValue: getRandomName(),
        decoration: InputDecoration(
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.grey.shade600),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.grey.shade600),
          ),
          labelText: 'NAME',
          floatingLabelStyle: TextStyle(color: Colors.grey.shade600),
        ),
      ),
    );
  }
}

class ProtectionsStep extends StatefulWidget {
  const ProtectionsStep({super.key});

  @override
  State<ProtectionsStep> createState() => _ProtectionsStepState();
}

class _ProtectionsStepState extends State<ProtectionsStep> {
  bool noEncryption = false;
  static const WidgetStateProperty<Icon> thumbIcon =
      WidgetStateProperty<Icon>.fromMap(<WidgetStatesConstraint, Icon>{
        WidgetState.selected: Icon(Icons.check, color: Colors.white),
        WidgetState.any: Icon(Icons.close),
      });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 20),
      child: ListTile(
        leading: Icon(Icons.security),
        title: Text('Enable end-to-end encryption'),
        trailing: Switch(
          value: noEncryption,
          onChanged: (bool choice) {
            setState(() {
              noEncryption = choice;
            });
          },
          thumbIcon: thumbIcon,
          activeColor: Colors.blue,
        ),
      ),
    );
  }
}

class PasteData {
  TextData? textData;
  FilesData filesData = FilesData();
}

class TextData {
  String? text;
}

class FilesData {
  static const maxSize = 100 * 1024 * 1024;
  int totalSize = 0;
  List<PlatformFile>? files;

  void setFiles(List<PlatformFile> files) {
    int totalSize = files.fold(
      0,
      (prevSize, currFile) => prevSize + currFile.size,
    );
    if (totalSize > maxSize) {
      throw MaxTotalFileSizeExceededException(
        'Your selected file(s) exceed the maximum size limit of 100MiB per clipboard. Please choose smaller file(s)',
      );
    }
    this.totalSize = totalSize;
    this.files = files;
  }

  void clearFiles() {
    files = null;
    totalSize = 0;
  }
}

class MaxTotalFileSizeExceededException implements Exception {
  final String message;
  MaxTotalFileSizeExceededException(this.message);

  @override
  String toString() => message;
}
